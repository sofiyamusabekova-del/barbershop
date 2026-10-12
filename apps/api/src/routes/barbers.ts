import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const barberParamSchema = z.object({
  id: z.string().min(1),
});

export async function barbersRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // GET /api/v1/barbers - получение списка активных барберов
  fastify.get('/', async (_request, reply) => {
    try {
      const barbers = await prisma.barber.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          role: true,
          photoUrl: true,
          bio: true,
          experienceYears: true,
          sortOrder: true,
          barberServices: {
            where: { isEnabled: true },
            select: {
              serviceId: true,
              durationMin: true,
              price: true,
            },
          },
          portfolioItems: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              imageUrl: true,
              title: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: barbers,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Не удалось загрузить список барберов',
        },
      });
    }
  });

  // GET /api/v1/barbers/:id - карточка конкретного барбера
  fastify.get('/:id', async (request, reply) => {
    const parseResult = barberParamSchema.safeParse(request.params);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Некорректный идентификатор барбера',
        },
      });
    }

    const { id } = parseResult.data;

    try {
      const barber = await prisma.barber.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          role: true,
          photoUrl: true,
          bio: true,
          experienceYears: true,
          sortOrder: true,
          barberServices: {
            where: { isEnabled: true },
            select: {
              serviceId: true,
              durationMin: true,
              price: true,
              service: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  durationMin: true,
                },
              },
            },
          },
          portfolioItems: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              imageUrl: true,
              title: true,
            },
          },
          reviews: {
            where: { isPublic: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              client: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!barber) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Барбер не найден',
          },
        });
      }

      return reply.send({
        success: true,
        data: barber,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ошибка при получении данных барбера',
        },
      });
    }
  });
}
