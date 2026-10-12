import { describe, it } from 'node:test';
import assert from 'node:assert';

// Тестирование логики пересечения временных интервалов и генерации слотов
function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function checkConflict(
  slotStart: number,
  slotEnd: number,
  busyIntervals: { start: number; end: number }[]
): boolean {
  return busyIntervals.some((busy) => slotStart < busy.end && slotEnd > busy.start);
}

describe('Расчёт свободных слотов (Availability Unit Tests)', () => {
  it('Корректно определяет свободный слот без пересечений', () => {
    const busy = [
      { start: 600, end: 660 }, // 10:00 - 11:00
      { start: 810, end: 870 }, // 13:30 - 14:30 (обед)
    ];

    // Слот 11:30 - 12:20 (690 - 740)
    const conflict = checkConflict(690, 740, busy);
    assert.strictEqual(conflict, false);
  });

  it('Блокирует слот, если он заходит на обеденный перерыв', () => {
    const busy = [
      { start: 810, end: 870 }, // 13:30 - 14:30 (обед)
    ];

    // Попытка взять 50-мин услугу в 13:00 - 13:50 (780 - 830)
    const conflict = checkConflict(780, 830, busy);
    assert.strictEqual(conflict, true);
  });

  it('Блокирует слот, если он частично пересекает подтвержденную запись', () => {
    const busy = [
      { start: 660, end: 720 }, // 11:00 - 12:00
    ];

    // Слот 10:45 - 11:35 (645 - 695)
    const conflict = checkConflict(645, 695, busy);
    assert.strictEqual(conflict, true);
  });
});
