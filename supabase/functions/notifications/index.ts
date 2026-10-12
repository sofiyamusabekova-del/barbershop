// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendTelegram(chatId: string | number, text: string, replyMarkup?: any) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log(`[Mock Telegram ${chatId}]: ${text}`);
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
  } catch (err) {
    console.error(`Telegram send error to ${chatId}:`, err);
  }
}

serve(async (req: Request) => {
  // Проверка авторизации CRON_SECRET (если передан)
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date();
  const summary = {
    reminder24hSent: 0,
    reminder30mSent: 0,
    autoCompleted: 0,
    reviewsRequested: 0,
  };

  try {
    // -------------------------------------------------------------
    // 1. НАПОМИНАНИЕ ЗА 24 ЧАСА
    // Окно визита: от (now + 23h) до (now + 25h)
    // -------------------------------------------------------------
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

    const { data: dayBookings, error: dayError } = await supabase
      .from('bookings')
      .select(`
        id,
        starts_at,
        total_price,
        manage_token,
        clients:client_id (name, phone, telegram_chat_id),
        barbers:barber_id (name, role),
        booking_services (name)
      `)
      .eq('status', 'confirmed')
      .is('reminder_day_sent_at', null)
      .gte('starts_at', in23h)
      .lte('starts_at', in25h);

    if (dayError) console.error('Error fetching 24h reminders:', dayError);

    if (dayBookings && dayBookings.length > 0) {
      for (const b of dayBookings) {
        const client = b.clients as any;
        const barber = b.barbers as any;
        const services = (b.booking_services as any[])?.map((s) => s.name).join(', ') || 'Услуги';

        if (client?.telegram_chat_id) {
          const dateStr = new Date(b.starts_at).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          });

          const keyboard = {
            inline_keyboard: [
              [{ text: '📱 Детали записи', url: `${APP_URL}/booking/${b.manage_token}` }],
            ],
          };

          const text =
            `⏳ <b>Напоминание о записи на завтра!</b>\n\n` +
            `🗓 <b>Время:</b> ${dateStr}\n` +
            `💈 <b>Мастер:</b> ${barber?.name}\n` +
            `💇‍♂️ <b>Услуги:</b> ${services}\n` +
            `📍 <b>Адрес:</b> ул. Большая Никитская, 24\n\n` +
            `Ждем вас! Если ваши планы изменились, пожалуйста, предупредите нас заранее.`;

          await sendTelegram(client.telegram_chat_id, text, keyboard);
        }

        // Фиксируем отправку (идемпотентность)
        await supabase
          .from('bookings')
          .update({ reminder_day_sent_at: new Date().toISOString() })
          .eq('id', b.id);

        summary.reminder24hSent++;
      }
    }

    // -------------------------------------------------------------
    // 2. НАПОМИНАНИЕ ЗА 30 МИНУТ
    // Окно визита: от (now + 20m) до (now + 40m)
    // -------------------------------------------------------------
    const in20m = new Date(now.getTime() + 20 * 60 * 1000).toISOString();
    const in40m = new Date(now.getTime() + 40 * 60 * 1000).toISOString();

    const { data: soonBookings, error: soonError } = await supabase
      .from('bookings')
      .select(`
        id,
        starts_at,
        manage_token,
        clients:client_id (name, telegram_chat_id),
        barbers:barber_id (name)
      `)
      .eq('status', 'confirmed')
      .is('reminder_30m_sent_at', null)
      .gte('starts_at', in20m)
      .lte('starts_at', in40m);

    if (soonError) console.error('Error fetching 30m reminders:', soonError);

    if (soonBookings && soonBookings.length > 0) {
      for (const b of soonBookings) {
        const client = b.clients as any;
        const barber = b.barbers as any;

        if (client?.telegram_chat_id) {
          const timeStr = new Date(b.starts_at).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          });

          const text =
            `🔔 <b>Ваш визит через 30 минут (${timeStr})!</b>\n\n` +
            `Мастер <b>${barber?.name}</b> уже ожидает вас.\n` +
            `📍 ул. Большая Никитская, 24\n` +
            `☕️ Чай, кофе и напитки готовы.`;

          await sendTelegram(client.telegram_chat_id, text);
        }

        await supabase
          .from('bookings')
          .update({ reminder_30m_sent_at: new Date().toISOString() })
          .eq('id', b.id);

        summary.reminder30mSent++;
      }
    }

    // -------------------------------------------------------------
    // 3. АВТОЗАВЕРШЕНИЕ ПРОШЕДШИХ ЗАПИСЕЙ
    // ends_at < now() и status = 'confirmed'
    // -------------------------------------------------------------
    const { data: pastBookings, error: pastError } = await supabase
      .from('bookings')
      .select('id')
      .eq('status', 'confirmed')
      .lt('ends_at', now.toISOString());

    if (pastError) console.error('Error fetching past bookings:', pastError);

    if (pastBookings && pastBookings.length > 0) {
      const pastIds = pastBookings.map((b: any) => b.id);
      await supabase
        .from('bookings')
        .update({
          status: 'completed',
          auto_completed_at: new Date().toISOString(),
        })
        .in('id', pastIds);

      summary.autoCompleted = pastIds.length;
    }

    // -------------------------------------------------------------
    // 4. ЗАПРОС ОТЗЫВА ПОСЛЕ ВИЗИТА
    // status = completed, review_requested_at IS NULL, ends_at < (now - 1h)
    // -------------------------------------------------------------
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    const { data: reviewBookings, error: reviewError } = await supabase
      .from('bookings')
      .select(`
        id,
        manage_token,
        clients:client_id (name, telegram_chat_id),
        barbers:barber_id (name)
      `)
      .eq('status', 'completed')
      .is('review_requested_at', null)
      .lt('ends_at', oneHourAgo);

    if (reviewError) console.error('Error fetching review requests:', reviewError);

    if (reviewBookings && reviewBookings.length > 0) {
      for (const b of reviewBookings) {
        const client = b.clients as any;
        const barber = b.barbers as any;

        if (client?.telegram_chat_id) {
          const keyboard = {
            inline_keyboard: [
              [
                { text: '⭐️ 5', url: `${APP_URL}/booking/${b.manage_token}?review=5` },
                { text: '⭐️ 4', url: `${APP_URL}/booking/${b.manage_token}?review=4` },
                { text: '⭐️ 3', url: `${APP_URL}/booking/${b.manage_token}?review=3` },
              ],
              [{ text: '✍️ Оставить отзыв', url: `${APP_URL}/booking/${b.manage_token}#review` }],
            ],
          };

          const text =
            `💈 <b>Спасибо, что посетили Chop & Craft!</b>\n\n` +
            `Как вам стрижка у мастера <b>${barber?.name}</b>?\n` +
            `Пожалуйста, оцените визит — это помогает нам становиться лучше.`;

          await sendTelegram(client.telegram_chat_id, text, keyboard);
        }

        await supabase
          .from('bookings')
          .update({ review_requested_at: new Date().toISOString() })
          .eq('id', b.id);

        summary.reviewsRequested++;
      }
    }

    return new Response(JSON.stringify({ success: true, timestamp: now.toISOString(), summary }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
