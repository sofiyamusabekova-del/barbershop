import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { calculateAvailableSlots } from '../services/availability.js';
import { prisma } from '../prisma.js';

const availabilityQuerySchema = z.object({
  serviceIds: z.string().or(z.array(z.string())),
  barberId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате YYYY-MM-DD'),
});

const daysQuerySchema = z.object({
  serviceIds: z.string().or(z.array(z.string())),
  barberId: z.string().optional(),
  days: z.coerce.number().min(1).max(30).default(14),
});

export async function availabilityRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // GET /api/v1/availability - список свободных слотов на конкретную дату
  fastify.get('/', async (request, reply) => {
    const parseResult = availabilityQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Некорректные параметры запроса слотов',
          details: parseResult.error.format(),
        },
      });
    }

    const { serviceIds, barberId, date } = parseResult.data;
    const ids = Array.isArray(serviceIds) ? serviceIds : serviceIds.split(',').filter(Boolean);

    try {
      const slots = await calculateAvailableSlots({
        serviceIds: ids,
        barberId,
        dateStr: date,
      });

      return reply.send({
        success: true,
        data: slots,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ошибка при расчёте доступных слотов',
        },
      });
    }
  });

  // GET /api/v1/availability/days - проверка доступности слотов на ближайшие N дней
  fastify.get('/days', async (request, reply) => {
    const parseResult = daysQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Некорректные параметры запроса дней',
          details: parseResult.error.format(),
        },
      });
    }

    const { serviceIds, barberId, days } = parseResult.data;
    const ids = Array.isArray(serviceIds) ? serviceIds : serviceIds.split(',').filter(Boolean);

    try {
      const results = [];
      const now = new Date();

      for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];

        const slots = await calculateAvailableSlots({
          serviceIds: ids,
          barberId,
          dateStr,
        });

        results.push({
          date: dateStr,
          hasSlots: slots.length > 0,
          slotsCount: slots.length,
        });
      }

      return reply.send({
        success: true,
        data: results,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ошибка при расчёте календаря доступности',
        },
      });
    }
  });
}
