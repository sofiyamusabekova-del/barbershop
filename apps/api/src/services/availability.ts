import { prisma } from '../prisma.js';

export interface TimeSlot {
  time: string; // HH:mm (например "10:00")
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
  barberId: string;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  hasSlots: boolean;
  slotsCount: number;
}

// Вспомогательный перевод "HH:mm" в минуты от начала суток
function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Вспомогательный перевод минут в "HH:mm"
function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function calculateAvailableSlots(params: {
  serviceIds: string[];
  barberId?: string; // uuid или "any"
  dateStr: string; // YYYY-MM-DD
}): Promise<TimeSlot[]> {
  const { serviceIds, barberId, dateStr } = params;

  if (!serviceIds || serviceIds.length === 0) {
    return [];
  }

  // 1. Получаем услуги и рассчитываем общую длительность
  const services = await prisma.service.findMany({
    where: {
      id: { in: serviceIds },
      isActive: true,
    },
  });

  if (services.length !== serviceIds.length) {
    return [];
  }

  const totalDurationMin = services.reduce((sum, s) => sum + s.durationMin, 0);

  // 2. Получаем системные настройки (step, notice, horizon)
  const settings = await prisma.setting.findMany();
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  const slotStepMin = Number(settingsMap.get('slot_step_min')) || 15;
  const minNoticeMin = Number(settingsMap.get('min_notice_min')) || 30;
  const horizonDays = Number(settingsMap.get('booking_horizon_days')) || 30;

  // 3. Проверка горизонта бронирования
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
  const now = new Date();
  const maxDate = new Date();
  maxDate.setDate(now.getDate() + horizonDays);

  if (targetDate > maxDate) {
    return [];
  }

  const dayOfWeek = targetDate.getUTCDay(); // 0 = Sun, 1 = Mon ...

  // 4. Определяем пул барберов для расчета
  const barberWhere = barberId && barberId !== 'any' ? { id: barberId, isActive: true } : { isActive: true };
  const candidateBarbers = await prisma.barber.findMany({
    where: barberWhere,
    include: {
      workingHours: { where: { weekday: dayOfWeek } },
      breaks: { where: { weekday: dayOfWeek } },
    },
  });

  if (candidateBarbers.length === 0) {
    return [];
  }

  // 5. Границы рабочего дня
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  // Общие time_off для всего салона или кандидатов
  const timeOffs = await prisma.timeOff.findMany({
    where: {
      OR: [
        { barberId: null },
        { barberId: { in: candidateBarbers.map((b) => b.id) } },
      ],
      startsAt: { lte: endOfDay },
      endsAt: { gte: startOfDay },
    },
  });

  // Существующие активные записи
  const confirmedBookings = await prisma.booking.findMany({
    where: {
      barberId: { in: candidateBarbers.map((b) => b.id) },
      status: 'confirmed',
      startsAt: { lte: endOfDay },
      endsAt: { gte: startOfDay },
    },
  });

  const slotsMap = new Map<string, TimeSlot>(); // time -> TimeSlot

  const minNoticeTime = new Date(now.getTime() + minNoticeMin * 60 * 1000);

  // 6. Расчет для каждого кандидата
  for (const barber of candidateBarbers) {
    const workHour = barber.workingHours[0];
    if (!workHour) continue; // Барбер не работает в этот день

    const workStartMin = timeStringToMinutes(workHour.startTime);
    const workEndMin = timeStringToMinutes(workHour.endTime);

    // Занятые интервалы барбера в минутах от начала дня
    const busyIntervals: { start: number; end: number }[] = [];

    // Обеды
    for (const brk of barber.breaks) {
      busyIntervals.push({
        start: timeStringToMinutes(brk.startTime),
        end: timeStringToMinutes(brk.endTime),
      });
    }

    // Time-off
    const barberTimeOffs = timeOffs.filter((t) => t.barberId === null || t.barberId === barber.id);
    for (const to of barberTimeOffs) {
      const toStart = new Date(Math.max(to.startsAt.getTime(), startOfDay.getTime()));
      const toEnd = new Date(Math.min(to.endsAt.getTime(), endOfDay.getTime()));
      const sMin = toStart.getUTCHours() * 60 + toStart.getUTCMinutes();
      const eMin = toEnd.getUTCHours() * 60 + toEnd.getUTCMinutes();
      if (eMin > sMin) {
        busyIntervals.push({ start: sMin, end: eMin });
      }
    }

    // Записи в БД
    const barberBookings = confirmedBookings.filter((b) => b.barberId === barber.id);
    for (const bkg of barberBookings) {
      const bStart = new Date(Math.max(bkg.startsAt.getTime(), startOfDay.getTime()));
      const bEnd = new Date(Math.min(bkg.endsAt.getTime(), endOfDay.getTime()));
      const sMin = bStart.getUTCHours() * 60 + bStart.getUTCMinutes();
      const eMin = bEnd.getUTCHours() * 60 + bEnd.getUTCMinutes();
      if (eMin > sMin) {
        busyIntervals.push({ start: sMin, end: eMin });
      }
    }

    // 7. Проход сетки слотов с шагом slotStepMin
    for (let slotMin = workStartMin; slotMin + totalDurationMin <= workEndMin; slotMin += slotStepMin) {
      const slotEndMin = slotMin + totalDurationMin;

      // Проверка пересечения с любым занятым интервалом
      const hasConflict = busyIntervals.some((busy) => {
        return slotMin < busy.end && slotEndMin > busy.start;
      });

      if (!hasConflict) {
        const timeStr = minutesToTimeString(slotMin);
        const slotStartsAt = new Date(`${dateStr}T${timeStr}:00.000Z`);
        const slotEndsAt = new Date(`${dateStr}T${minutesToTimeString(slotEndMin)}:00.000Z`);

        // Проверка min_notice_min и прошлого времени
        if (slotStartsAt > minNoticeTime) {
          if (!slotsMap.has(timeStr)) {
            slotsMap.set(timeStr, {
              time: timeStr,
              startsAt: slotStartsAt.toISOString(),
              endsAt: slotEndsAt.toISOString(),
              barberId: barber.id,
            });
          }
        }
      }
    }
  }

  // Сортируем слоты по времени
  return Array.from(slotsMap.values()).sort((a, b) => a.time.localeCompare(b.time));
}
