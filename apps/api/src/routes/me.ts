import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { validateTelegramInitData } from '../utils/telegramAuth.js';

const authInitDataSchema = z.object({
  initData: z.string().min(1, 'initData is required'),
});

export async function meRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // POST /api/v1/me/auth - авторизация/проверка initData от Telegram Mini App
  fastify.post('/auth', async (request, reply) => {
    const parseResult = authInitDataSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Некорректный initData' },
      });
    }

    const { initData } = parseResult.data;
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

    // Валидация HMAC (если botToken не задан в dev режиме, разрешаем для тестов)
    const { isValid, user } = validateTelegramInitData(initData, botToken);
    
    // В dev среде если botToken = mock или пустой, парсим данные пользователя без строгой ошибки
    let telegramUser = user;
    if (!isValid) {
      try {
        const params = new URLSearchParams(initData);
        const userJson = params.get('user');
        if (userJson) {
          telegramUser = JSON.parse(userJson);
        }
      } catch (e) {
        // ignore
      }
    }

    if (!isValid && botToken && botToken !== 'mock-token' && !process.env.DEV_BYPASS_TG_AUTH) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_TELEGRAM_INIT_DATA',
          message: 'Подпись Telegram WebApp недействительна',
        },
      });
    }

    if (!telegramUser || !telegramUser.id) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND_IN_INIT_DATA',
          message: 'Данные пользователя отсутствуют в initData',
        },
      });
    }

    try {
      // Ищем или создаем клиента по telegramId
      const telegramIdBigInt = BigInt(telegramUser.id);
      let client = await prisma.client.findUnique({
        where: { telegramId: telegramIdBigInt },
      });

      const clientName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || telegramUser.username || `User_${telegramUser.id}`;

      if (!client) {
        client = await prisma.client.create({
          data: {
            name: clientName,
            phone: `tg_${telegramUser.id}`, // Временный телефон до ввода
            telegramId: telegramIdBigInt,
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          client: {
            id: client.id,
            name: client.name,
            phone: client.phone.startsWith('tg_') ? '' : client.phone,
            telegramId: client.telegramId ? client.telegramId.toString() : null,
          },
          user: telegramUser,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка авторизации через Telegram' },
      });
    }
  });

  // GET /api/v1/me/bookings - получение списка записей пользователя Telegram
  fastify.get('/bookings', async (request, reply) => {
    const telegramIdParam = (request.query as any)?.telegramId;
    const phoneParam = (request.query as any)?.phone;

    if (!telegramIdParam && !phoneParam) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'MISSING_USER_IDENTIFIER',
          message: 'Укажите telegramId или phone',
        },
      });
    }

    try {
      let clientWhere: any = {};
      if (telegramIdParam) {
        try {
          clientWhere = { telegramId: BigInt(telegramIdParam) };
        } catch {
          clientWhere = { phone: phoneParam || '' };
        }
      } else if (phoneParam) {
        clientWhere = { phone: phoneParam };
      }

      const client = await prisma.client.findFirst({
        where: clientWhere,
      });

      if (!client) {
        return reply.send({
          success: true,
          data: [],
        });
      }

      const bookings = await prisma.booking.findMany({
        where: { clientId: client.id },
        orderBy: { startsAt: 'desc' },
        include: {
          barber: {
            select: {
              id: true,
              name: true,
              role: true,
              photoUrl: true,
            },
          },
          bookingServices: true,
          review: true,
        },
      });

      return reply.send({
        success: true,
        data: bookings,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Ошибка загрузки записей' },
      });
    }
  });
}
