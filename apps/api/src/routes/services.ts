import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '../prisma.js';

export async function servicesRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // GET /api/v1/services - получение активных услуг
  fastify.get('/', async (_request, reply) => {
    try {
      const services = await prisma.service.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          durationMin: true,
          price: true,
          category: true,
          sortOrder: true,
        },
      });

      return reply.send({
        success: true,
        data: services,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Не удалось загрузить список услуг',
        },
      });
    }
  });
}
