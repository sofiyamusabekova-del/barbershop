import { prisma } from '../prisma.js';
import { notifyTelegram } from '../bot.js';

export interface CronRunResult {
  reminder24hSent: number;
  reminder30mSent: number;
  autoCompleted: number;
  reviewsRequested: number;
}

/**
 * Идемпотентный процессинг фоновых уведомлений, напоминаний и завершения записей
 */
export async function processNotificationsCron(): Promise<CronRunResult> {
  const now = new Date();
  const result: CronRunResult = {
    reminder24hSent: 0,
    reminder30mSent: 0,
    autoCompleted: 0,
    reviewsRequested: 0,
  };

  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  // -------------------------------------------------------------
  // 1. НАПОМИНАНИЕ ЗА 24 ЧАСА (окно от now+23h до now+25h)
  // -------------------------------------------------------------
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const dayBookings = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      reminderDaySentAt: null,
      startsAt: {
        gte: in23h,
        lte: in25h,
      },
    },
    include: {
      client: true,
      barber: true,
      bookingServices: true,
    },
  });

  for (const b of dayBookings) {
    if (b.client?.telegramChatId) {
      const dateStr = new Date(b.startsAt).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
      const servicesStr = b.bookingServices.map((s) => s.name).join(', ');

      const text =
        `⏳ <b>Напоминание о записи на завтра!</b>\n\n` +
        `🗓 <b>Время:</b> ${dateStr}\n` +
        `💈 <b>Мастер:</b> ${b.barber.name}\n` +
        `💇‍♂️ <b>Услуги:</b> ${servicesStr}\n` +
        `📍 <b>Адрес:</b> ул. Большая Никитская, 24\n\n` +
        `Ждем вас! Если ваши планы изменились, пожалуйста, предупредите нас заранее.`;

      await notifyTelegram(b.client.telegramChatId, text);
    }

    await prisma.booking.update({
      where: { id: b.id },
      data: { reminderDaySentAt: new Date() },
    });

    result.reminder24hSent++;
  }

  // -------------------------------------------------------------
  // 2. НАПОМИНАНИЕ ЗА 30 МИНУТ (окно от now+20m до now+40m)
  // -------------------------------------------------------------
  const in20m = new Date(now.getTime() + 20 * 60 * 1000);
  const in40m = new Date(now.getTime() + 40 * 60 * 1000);

  const soonBookings = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      reminder30mSentAt: null,
      startsAt: {
        gte: in20m,
        lte: in40m,
      },
    },
    include: {
      client: true,
      barber: true,
    },
  });

  for (const b of soonBookings) {
    if (b.client?.telegramChatId) {
      const timeStr = new Date(b.startsAt).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const text =
        `🔔 <b>Ваш визит через 30 минут (${timeStr})!</b>\n\n` +
        `Мастер <b>${b.barber.name}</b> ожидает вас.\n` +
        `📍 ул. Большая Никитская, 24\n` +
        `☕️ Чай, кофе и напитки готовы.`;

      await notifyTelegram(b.client.telegramChatId, text);
    }

    await prisma.booking.update({
      where: { id: b.id },
      data: { reminder30mSentAt: new Date() },
    });

    result.reminder30mSent++;
  }

  // -------------------------------------------------------------
  // 3. АВТОЗАВЕРШЕНИЕ ПРОШЕДШИХ ЗАПИСЕЙ
  // -------------------------------------------------------------
  const pastBookings = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      endsAt: { lt: now },
    },
    select: { id: true },
  });

  if (pastBookings.length > 0) {
    const ids = pastBookings.map((b) => b.id);
    await prisma.booking.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'completed',
        autoCompletedAt: new Date(),
      },
    });

    result.autoCompleted = ids.length;
  }

  // -------------------------------------------------------------
  // 4. ЗАПРОС ОТЗЫВА ПОСЛЕ ВИЗИТА (> 1 часа после завершения)
  // -------------------------------------------------------------
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const reviewBookings = await prisma.booking.findMany({
    where: {
      status: 'completed',
      reviewRequestedAt: null,
      endsAt: { lt: oneHourAgo },
    },
    include: {
      client: true,
      barber: true,
    },
  });

  for (const b of reviewBookings) {
    if (b.client?.telegramChatId) {
      const text =
        `💈 <b>Спасибо, что посетили Chop & Craft!</b>\n\n` +
        `Как вам стрижка у мастера <b>${b.barber.name}</b>?\n` +
        `Пожалуйста, оцените ваш визит: ${appUrl}/booking/${b.manageToken}#review`;

      await notifyTelegram(b.client.telegramChatId, text);
    }

    await prisma.booking.update({
      where: { id: b.id },
      data: { reviewRequestedAt: new Date() },
    });

    result.reviewsRequested++;
  }

  return result;
}
