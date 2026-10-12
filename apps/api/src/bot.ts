import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { prisma } from './prisma.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
export const bot = token ? new Bot(token) : null;

/**
 * Инициализация обработчиков команд и сообщений Telegram-бота
 */
export function setupBotHandlers() {
  if (!bot) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN не задан. Бот работает в mock-режиме.');
    return;
  }

  // Обработка команды /start и deep links (b_<token> или barber_<code/id>)
  bot.command('start', async (ctx) => {
    const payload = ctx.match; // параметр start (например: b_d9471f4b-..., barber_alex, etc.)
    const fromUser = ctx.from;

    if (!fromUser) return;

    const telegramId = BigInt(fromUser.id);
    const chatId = BigInt(ctx.chat.id);
    const userName = [fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ') || fromUser.username || 'Гость';

    // 1. Deep link привязки барбера: barber_<code/id>
    if (payload && payload.startsWith('barber_')) {
      const barberIdentifier = payload.replace('barber_', '');
      
      const barber = await prisma.barber.findFirst({
        where: {
          OR: [
            { id: barberIdentifier },
            { name: { contains: barberIdentifier, mode: 'insensitive' } },
          ],
        },
      });

      if (barber) {
        await prisma.barber.update({
          where: { id: barber.id },
          data: { telegramChatId: chatId },
        });

        await ctx.reply(
          `💈 <b>Добро пожаловать, ${barber.name}!</b>\n\n` +
          `Ваш Telegram-аккаунт успешно привязан к профилю мастера.\n` +
          `Теперь вы будете получать мгновенные уведомления о новых записях и отменах.`,
          { parse_mode: 'HTML' }
        );
        return;
      } else {
        await ctx.reply(`⚠️ Барбер с кодом «${barberIdentifier}» не найден.`);
      }
    }

    // 2. Ищем или создаем клиента и сохраняем telegramId & telegramChatId
    let client = await prisma.client.findUnique({
      where: { telegramId },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: userName,
          phone: `tg_${fromUser.id}`,
          telegramId,
          telegramChatId: chatId,
        },
      });
    } else {
      client = await prisma.client.update({
        where: { id: client.id },
        data: { telegramChatId: chatId },
      });
    }

    // 3. Deep link привязки к конкретной брони с сайта: b_<manageToken>
    if (payload && payload.startsWith('b_')) {
      const manageToken = payload.replace('b_', '');
      const booking = await prisma.booking.findUnique({
        where: { manageToken },
        include: {
          client: true,
          barber: true,
          bookingServices: true,
        },
      });

      if (booking) {
        // Привязываем клиента брони к данному Telegram-аккаунту
        if (booking.client && (!booking.client.telegramId || booking.client.telegramId === telegramId)) {
          await prisma.client.update({
            where: { id: booking.client.id },
            data: {
              telegramId,
              telegramChatId: chatId,
            },
          });
        }

        const dateStr = new Date(booking.startsAt).toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'long',
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
        });

        const servicesStr = booking.bookingServices.map((s) => s.name).join(', ');

        const keyboard = new InlineKeyboard()
          .url('📱 Открыть запись', `${process.env.APP_URL || 'http://localhost:3000'}/booking/${booking.manageToken}`)
          .row()
          .text('❌ Отменить запись', `cancel_${booking.manageToken}`);

        await ctx.reply(
          `✂️ <b>Запись подтверждена и привязана к вашему Telegram!</b>\n\n` +
          `👤 <b>Мастер:</b> ${booking.barber.name} (${booking.barber.role})\n` +
          `🗓 <b>Дата и время:</b> ${dateStr}\n` +
          `💇‍♂️ <b>Услуги:</b> ${servicesStr}\n` +
          `💰 <b>Стоимость:</b> ${booking.totalPrice} ₽\n` +
          `📍 <b>Адрес:</b> ул. Большая Никитская, 24\n\n` +
          `Мы напомним вам о визите за 24 часа и за 30 минут.`,
          { parse_mode: 'HTML', reply_markup: keyboard }
        );
        return;
      }
    }

    // 4. Обычный приветственный экран
    const miniAppUrl = process.env.MINIAPP_URL || 'http://localhost:3001';
    const keyboard = new InlineKeyboard()
      .webApp('💈 Записаться онлайн', miniAppUrl)
      .row()
      .text('📋 Мои записи', 'cmd_my_bookings')
      .text('ℹ️ О барбершопе', 'cmd_about');

    await ctx.reply(
      `👋 <b>Здравствуйте, ${userName}!</b>\n\n` +
      `Добро пожаловать в премиальный барбершоп <b>Chop & Craft</b>.\n` +
      `Здесь вы можете быстро записаться на стрижку, моделирование бороды или комплексный уход.`,
      {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }
    );
  });

  // Меню: Мои записи
  bot.callbackQuery('cmd_my_bookings', async (ctx) => {
    await ctx.answerCallbackQuery();
    const fromUser = ctx.from;
    const telegramId = BigInt(fromUser.id);

    const client = await prisma.client.findUnique({
      where: { telegramId },
      include: {
        bookings: {
          orderBy: { startsAt: 'desc' },
          take: 5,
          include: {
            barber: true,
            bookingServices: true,
          },
        },
      },
    });

    if (!client || !client.bookings || client.bookings.length === 0) {
      const keyboard = new InlineKeyboard().webApp('💈 Записаться сейчас', process.env.MINIAPP_URL || 'http://localhost:3001');
      await ctx.reply('У вас пока нет активных записей.', { reply_markup: keyboard });
      return;
    }

    for (const b of client.bookings) {
      const dateStr = new Date(b.startsAt).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      const servicesStr = b.bookingServices.map((s) => s.name).join(', ');
      const statusRu = b.status === 'confirmed' ? '✅ Подтверждена' : b.status === 'cancelled' ? '❌ Отменена' : '✔️ Завершена';

      const keyboard = new InlineKeyboard();
      if (b.status === 'confirmed') {
        keyboard
          .url('📱 Управление', `${process.env.APP_URL || 'http://localhost:3000'}/booking/${b.manageToken}`)
          .text('❌ Отменить', `cancel_${b.manageToken}`);
      }

      await ctx.reply(
        `<b>${statusRu}</b>\n` +
        `🗓 <b>${dateStr}</b>\n` +
        `💈 <b>Мастер:</b> ${b.barber.name}\n` +
        `💇‍♂️ <b>Услуги:</b> ${servicesStr}\n` +
        `💰 <b>Сумма:</b> ${b.totalPrice} ₽`,
        {
          parse_mode: 'HTML',
          reply_markup: b.status === 'confirmed' ? keyboard : undefined,
        }
      );
    }
  });

  // Меню: Информация о салоне
  bot.callbackQuery('cmd_about', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `💈 <b>Chop & Craft Barbershop</b>\n\n` +
      `📍 <b>Адрес:</b> ул. Большая Никитская, 24\n` +
      `⏰ <b>Режим работы:</b> Ежедневно с 10:00 до 22:00\n` +
      `📞 <b>Телефон:</b> +7 (495) 123-45-67\n` +
      `⭐️ Авторские стрижки, уход премиальной мужской косметикой, напитки и комфортная атмосфера.`,
      { parse_mode: 'HTML' }
    );
  });

  // Отмена записи через inline кнопку бота
  bot.callbackQuery(/^cancel_(.+)$/, async (ctx) => {
    const manageToken = ctx.match[1];
    await ctx.answerCallbackQuery();

    try {
      const booking = await prisma.booking.findUnique({
        where: { manageToken },
        include: { barber: true },
      });

      if (!booking) {
        await ctx.reply('Запись не найдена.');
        return;
      }

      if (booking.status === 'cancelled') {
        await ctx.reply('Эта запись уже отменена.');
        return;
      }

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled' },
      });

      await ctx.reply(
        `❌ Запись на ${new Date(booking.startsAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })} к мастеру ${booking.barber.name} успешно отменена.`
      );

      // Уведомляем барбера об отмене
      if (booking.barber?.telegramChatId) {
        notifyTelegram(
          booking.barber.telegramChatId.toString(),
          `⚠️ <b>Клиент отменил запись:</b>\n` +
          `🗓 ${new Date(booking.startsAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}`
        );
      }
    } catch (e: any) {
      await ctx.reply('Не удалось отменить запись: ' + (e.message || 'Ошибка сервера'));
    }
  });
}

/**
 * Отправка сообщения в Telegram
 */
export async function notifyTelegram(chatId: string | bigint | number, message: string, keyboard?: InlineKeyboard) {
  if (!bot || !process.env.TELEGRAM_BOT_TOKEN) {
    console.log(`[Mock Telegram Notification to ${chatId}]:\n${message}`);
    return;
  }

  try {
    await bot.api.sendMessage(chatId.toString(), message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error(`Failed to send Telegram message to ${chatId}:`, error);
  }
}

/**
 * Уведомление клиента и барбера о новой созданной брони
 */
export async function sendBookingNotifications(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        barber: true,
        bookingServices: true,
      },
    });

    if (!booking) return;

    const dateStr = new Date(booking.startsAt).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    const servicesStr = booking.bookingServices.map((s) => s.name).join(', ');
    const manageUrl = `${process.env.APP_URL || 'http://localhost:3000'}/booking/${booking.manageToken}`;

    // 1. Уведомление клиенту (если есть telegramChatId)
    if (booking.client?.telegramChatId) {
      const keyboard = new InlineKeyboard()
        .url('📱 Управление записью', manageUrl);

      const clientMsg =
        `✂️ <b>Запись успешно создана!</b>\n\n` +
        `👤 <b>Мастер:</b> ${booking.barber.name}\n` +
        `🗓 <b>Дата и время:</b> ${dateStr}\n` +
        `💇‍♂️ <b>Услуги:</b> ${servicesStr}\n` +
        `💰 <b>Сумма:</b> ${booking.totalPrice} ₽\n` +
        `📍 <b>Адрес:</b> ул. Большая Никитская, 24`;

      await notifyTelegram(booking.client.telegramChatId, clientMsg, keyboard);
    }

    // 2. Уведомление барберу (если привязан telegramChatId)
    if (booking.barber?.telegramChatId) {
      const barberMsg =
        `💈 <b>Новая запись в вашем графике!</b>\n\n` +
        `👤 <b>Клиент:</b> ${booking.client.name} (${booking.client.phone})\n` +
        `🗓 <b>Время:</b> ${dateStr}\n` +
        `💇‍♂️ <b>Услуги:</b> ${servicesStr}\n` +
        `⏳ <b>Длительность:</b> ${booking.totalDurationMin} мин\n` +
        (booking.comment ? `💬 <b>Пожелание:</b> ${booking.comment}\n` : '');

      await notifyTelegram(booking.barber.telegramChatId, barberMsg);
    }
  } catch (error) {
    console.error('Error sending booking notifications:', error);
  }
}

/**
 * Уведомление об отмене записи
 */
export async function sendCancelNotifications(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, barber: true },
    });

    if (!booking) return;

    const dateStr = new Date(booking.startsAt).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (booking.client?.telegramChatId) {
      await notifyTelegram(
        booking.client.telegramChatId,
        `❌ <b>Ваша запись отменена:</b>\n` +
        `🗓 ${dateStr} к мастеру ${booking.barber.name}.`
      );
    }

    if (booking.barber?.telegramChatId) {
      await notifyTelegram(
        booking.barber.telegramChatId,
        `⚠️ <b>Запись отменена клиентом:</b>\n` +
        `👤 ${booking.client.name}\n` +
        `🗓 ${dateStr}`
      );
    }
  } catch (error) {
    console.error('Error sending cancel notifications:', error);
  }
}

/**
 * Уведомление о переносе записи
 */
export async function sendRescheduleNotifications(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { client: true, barber: true, bookingServices: true },
    });

    if (!booking) return;

    const dateStr = new Date(booking.startsAt).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    const manageUrl = `${process.env.APP_URL || 'http://localhost:3000'}/booking/${booking.manageToken}`;

    if (booking.client?.telegramChatId) {
      const keyboard = new InlineKeyboard().url('📱 Посмотреть запись', manageUrl);
      await notifyTelegram(
        booking.client.telegramChatId,
        `🔄 <b>Ваша запись успешно перенесена!</b>\n\n` +
        `🗓 <b>Новая дата и время:</b> ${dateStr}\n` +
        `💈 <b>Мастер:</b> ${booking.barber.name}`,
        keyboard
      );
    }

    if (booking.barber?.telegramChatId) {
      await notifyTelegram(
        booking.barber.telegramChatId,
        `🔄 <b>Клиент перенес запись:</b>\n` +
        `👤 ${booking.client.name}\n` +
        `🗓 <b>Новое время:</b> ${dateStr}`
      );
    }
  } catch (error) {
    console.error('Error sending reschedule notifications:', error);
  }
}

/**
 * Настройка команд и кнопки меню Telegram-бота
 */
export async function setupBotMenu() {
  if (!bot) return;

  await bot.api.setMyCommands([
    { command: 'start', description: 'Главное меню / Запись' },
  ]);

  const miniappUrl = process.env.MINIAPP_URL;
  if (miniappUrl) {
    await bot.api.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: 'Записаться',
        web_app: { url: miniappUrl },
      },
    });
  }
}
