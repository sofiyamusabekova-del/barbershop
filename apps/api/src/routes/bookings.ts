import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { calculateAvailableSlots } from '../services/availability.js';
import { 
  sendBookingNotifications, 
  sendCancelNotifications, 
  sendRescheduleNotifications 
} from '../bot.js';

const createBookingSchema = z.object({
  serviceIds: z.array(z.string().min(1)).min(1, 'Необходимо выбрать хотя бы одну услугу'),
  barberId: z.string().min(1, 'Укажите барбера или any'),
  startsAt: z.string().datetime({ message: 'Некорректная дата/время ISO' }),
  client: z.object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    phone: z.string().min(9, 'Укажите корректный номер телефона'),
  }),
  comment: z.string().optional(),
  source: z.enum(['web', 'telegram', 'admin']).default('web'),
});

const rescheduleBookingSchema = z.object({
  startsAt: z.string().datetime({ message: 'Некорректная дата/время ISO' }),
});

export async function bookingsRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // POST /api/v1/bookings - создание новой записи
  fastify.post('/', async (request, reply) => {
    const parseResult = createBookingSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Некорректные данные бронирования',
          details: parseResult.error.format(),
        },
      });
    }

    const { serviceIds, barberId, startsAt, client, comment, source } = parseResult.data;

    // 1. Проверяем услуги
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, isActive: true },
    });

    if (services.length !== serviceIds.length) {
      return reply.status(422).send({
        success: false,
        error: {
          code: 'SERVICES_NOT_FOUND',
          message: 'Одна или несколько выбранных услуг недоступны',
        },
      });
    }

    const totalDurationMin = services.reduce((sum, s) => sum + s.durationMin, 0);
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    const bookingStartsAt = new Date(startsAt);
    const bookingEndsAt = new Date(bookingStartsAt.getTime() + totalDurationMin * 60 * 1000);

    // 2. Если barberId = "any", подбираем первого подходящего свободного барбера
    let targetBarberId = barberId;
    const dateStr = bookingStartsAt.toISOString().split('T')[0];

    const availableSlots = await calculateAvailableSlots({
      serviceIds,
      barberId: targetBarberId,
      dateStr,
    });

    const isSlotAvailable = availableSlots.some(
      (slot) => new Date(slot.startsAt).getTime() === bookingStartsAt.getTime()
    );

    if (!isSlotAvailable) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'SLOT_TAKEN',
          message: 'Выбранный слот уже занят или недоступен. Пожалуйста, выберите другое время.',
        },
      });
    }

    if (targetBarberId === 'any') {
      const matchingSlot = availableSlots.find(
        (slot) => new Date(slot.startsAt).getTime() === bookingStartsAt.getTime()
      );
      if (!matchingSlot) {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'SLOT_TAKEN',
            message: 'Свободный мастер на данное время не найден',
          },
        });
      }
      targetBarberId = matchingSlot.barberId;
    }

    try {
      // 3. Выполняем транзакцию создания клиента и записи
      const result = await prisma.$transaction(async (tx) => {
        // Upsert клиента по номеру телефона
        const cleanPhone = client.phone.trim();
        let dbClient = await tx.client.findUnique({
          where: { phone: cleanPhone },
        });

        if (!dbClient) {
          dbClient = await tx.client.create({
            data: {
              name: client.name.trim(),
              phone: cleanPhone,
            },
          });
        } else if (client.name && dbClient.name !== client.name.trim()) {
          dbClient = await tx.client.update({
            where: { id: dbClient.id },
            data: { name: client.name.trim() },
          });
        }

        // Создаем запись
        const newBooking = await tx.booking.create({
          data: {
            clientId: dbClient.id,
            barberId: targetBarberId,
            startsAt: bookingStartsAt,
            endsAt: bookingEndsAt,
            totalPrice,
            totalDurationMin,
            status: 'confirmed',
            source,
            comment,
            bookingServices: {
              create: services.map((s) => ({
                serviceId: s.id,
                name: s.name,
                durationMin: s.durationMin,
                price: s.price,
              })),
            },
          },
          include: {
            client: true,
            barber: true,
            bookingServices: true,
          },
        });

        return newBooking;
      });

      // Отправляем Telegram-уведомления (клиенту и барберу)
      sendBookingNotifications(result.id).catch((err) => {
        fastify.log.error('Failed to dispatch booking notifications:', err);
      });

      return reply.status(201).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      fastify.log.error(error);

      // Проверка на ошибку исключения пересечения PostgreSQL (код 23P01 exclusion_violation)
      if (
        error.code === 'P2010' ||
        (error.message && (error.message.includes('23P01') || error.message.includes('bookings_no_overlap')))
      ) {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'SLOT_TAKEN',
            message: 'Выбранный слот только что был занят другим клиентом',
          },
        });
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Не удалось завершить бронирование',
        },
      });
    }
  });

  // GET /api/v1/bookings/:token - информация о записи по manageToken
  fastify.get('/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    try {
      const booking = await prisma.booking.findUnique({
        where: { manageToken: token },
        include: {
          client: true,
          barber: true,
          bookingServices: true,
        },
      });

      if (!booking) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Запись не найдена',
          },
        });
      }

      return reply.send({
        success: true,
        data: booking,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ошибка при получении данных бронирования',
        },
      });
    }
  });

  // POST /api/v1/bookings/:token/cancel - отмена записи клиентом
  fastify.post('/:token/cancel', async (request, reply) => {
    const { token } = request.params as { token: string };

    try {
      const booking = await prisma.booking.findUnique({
        where: { manageToken: token },
      });

      if (!booking) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Запись не найдена',
          },
        });
      }

      if (booking.status === 'cancelled') {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ALREADY_CANCELLED',
            message: 'Эта запись уже была отменена ранее',
          },
        });
      }

      // Проверка cancel_cutoff_min
      const setting = await prisma.setting.findUnique({ where: { key: 'cancel_cutoff_min' } });
      const cancelCutoffMin = setting ? Number(setting.value) : 120;
      const now = new Date();
      const cutoffTime = new Date(booking.startsAt.getTime() - cancelCutoffMin * 60 * 1000);

      if (now > cutoffTime) {
        return reply.status(422).send({
          success: false,
          error: {
            code: 'CANCEL_CUTOFF_EXCEEDED',
            message: `Отмена невозможна менее чем за ${cancelCutoffMin} минут до визита. Свяжитесь с нами по телефону.`,
          },
        });
      }

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled' },
      });

      sendCancelNotifications(booking.id).catch((err) => {
        fastify.log.error('Failed to dispatch cancel notifications:', err);
      });

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ошибка при отмене бронирования',
        },
      });
    }
  });

  // POST /api/v1/bookings/:token/reschedule - перенос записи на новый слот
  fastify.post('/:token/reschedule', async (request, reply) => {
    const { token } = request.params as { token: string };
    const parseResult = rescheduleBookingSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Укажите новую дату и время (startsAt)',
        },
      });
    }

    const { startsAt } = parseResult.data;

    try {
      const booking = await prisma.booking.findUnique({
        where: { manageToken: token },
        include: { bookingServices: true },
      });

      if (!booking) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Запись не найдена' },
        });
      }

      const newStartsAt = new Date(startsAt);
      const newEndsAt = new Date(newStartsAt.getTime() + booking.totalDurationMin * 60 * 1000);
      const dateStr = newStartsAt.toISOString().split('T')[0];

      // Проверяем доступность нового слота у этого же барбера
      const availableSlots = await calculateAvailableSlots({
        serviceIds: booking.bookingServices.map((s) => s.serviceId),
        barberId: booking.barberId,
        dateStr,
      });

      const isSlotAvailable = availableSlots.some(
        (slot) => new Date(slot.startsAt).getTime() === newStartsAt.getTime()
      );

      if (!isSlotAvailable) {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'SLOT_TAKEN',
            message: 'Выбранный для переноса слот уже занят',
          },
        });
      }

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          startsAt: newStartsAt,
          endsAt: newEndsAt,
          status: 'confirmed',
        },
      });

      sendRescheduleNotifications(booking.id).catch((err) => {
        fastify.log.error('Failed to dispatch reschedule notifications:', err);
      });

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ошибка при переносе бронирования',
        },
      });
    }
  });
}
