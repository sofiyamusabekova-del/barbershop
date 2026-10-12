import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { webhookCallback } from 'grammy';
import { bot } from '../bot.js';

export async function telegramRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // POST /telegram/webhook - обработка событий от Telegram Bot API
  fastify.post('/webhook', async (request, reply) => {
    // Проверка секретного токена заголовка Telegram (если настроен)
    const secretHeader = request.headers['x-telegram-bot-api-secret-token'];
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (expectedSecret && secretHeader && secretHeader !== expectedSecret) {
      return reply.status(403).send({ error: 'Invalid secret token' });
    }

    if (!bot) {
      return reply.send({ ok: true, status: 'bot_not_configured' });
    }

    try {
      const handler = webhookCallback(bot, 'fastify');
      await handler(request as any, reply as any);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Webhook processing error' });
    }
  });

  // GET /telegram/status - статус работы бота
  fastify.get('/status', async (_request, reply) => {
    return reply.send({
      configured: !!bot,
      hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
      webhookPath: '/telegram/webhook',
    });
  });
}
