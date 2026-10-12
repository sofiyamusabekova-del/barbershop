import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import rateLimit from '@fastify/rate-limit';
import { servicesRoutes } from './routes/services.js';
import { barbersRoutes } from './routes/barbers.js';
import { availabilityRoutes } from './routes/availability.js';
import { bookingsRoutes } from './routes/bookings.js';
import { meRoutes } from './routes/me.js';
import { telegramRoutes } from './routes/telegram.js';
import { cronRoutes } from './routes/cron.js';
import { adminRoutes } from './routes/admin.js';
import { healthRoutes } from './routes/health.js';
import { setupBotHandlers } from './bot.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3010',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  const envOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

  // Настройка CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      // Разрешаем запросы без origin (curl, мобильные клиенты, server-to-server)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization'],
    credentials: true,
  });

  // Подключение Cookies и Сессий для админки
  await app.register(cookie);
  await app.register(session, {
    secret: process.env.SESSION_SECRET || 'a-very-long-secret-key-at-least-32-chars-long!',
    cookie: {
      secure: false, // в dev режиме
      httpOnly: true,
      maxAge: 86400000 * 7, // 7 дней
      sameSite: 'lax',
    },
  });

  // Rate Limiter для защиты от подбора паролей
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // GET /health - проверка здоровья
  await app.register(healthRoutes);

  // Инициализация обработчиков Telegram бота
  setupBotHandlers();

  // Подключение публичных маршрутов API v1
  await app.register(servicesRoutes, { prefix: '/api/v1/services' });
  await app.register(barbersRoutes, { prefix: '/api/v1/barbers' });
  await app.register(availabilityRoutes, { prefix: '/api/v1/availability' });
  await app.register(bookingsRoutes, { prefix: '/api/v1/bookings' });
  await app.register(meRoutes, { prefix: '/api/v1/me' });
  await app.register(telegramRoutes, { prefix: '/telegram' });
  await app.register(cronRoutes, { prefix: '/api/v1/cron' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });

  // Централизованный обработчик непредвиденных ошибок
  app.setErrorHandler((error: any, _request, reply) => {
    app.log.error(error);
    reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Произошла внутренняя ошибка сервера',
      },
    });
  });

  return app;
}
