import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { processNotificationsCron } from '../services/notificationsCron.js';

export async function cronRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // POST /api/v1/cron/notifications - триггер выполнения фонового цикла уведомлений
  fastify.post('/notifications', async (request, reply) => {
    // Опциональная проверка секретного ключа крона
    const authHeader = request.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const summary = await processNotificationsCron();
      return reply.send({
        success: true,
        timestamp: new Date().toISOString(),
        summary,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Cron execution failed',
      });
    }
  });
}
