'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Scissors, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Award,
  Flame,
  UserCheck
} from 'lucide-react';
import { adminGetAnalytics, adminGetBarbers } from '@/lib/adminApi';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any | null>(null);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Период
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');

  const loadAnalytics = async () => {
    setLoading(true);
    const now = new Date();
    const fromDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString();
    const toDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const [res, barbersList] = await Promise.all([
      adminGetAnalytics({
        from: fromDate,
        to: toDate,
        barberId: selectedBarberId || undefined,
      }),
      adminGetBarbers(),
    ]);

    setData(res);
    setBarbers(barbersList);
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, [periodDays, selectedBarberId]);

  const weekdayLabels = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  return (
    <div>
      {/* Шапка аналитики */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'Cinzel, serif', color: '#f3f4f6' }}>
            Бизнес-аналитика и метрики
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
            Выручка, загрузка мастеров, популярность услуг и тепловая карта посещений
          </p>
        </div>

        {/* Контролы периода и фильтра */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            style={{
              backgroundColor: '#12161f',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#f3f4f6',
              padding: '10px 14px',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">Все мастера</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            style={{
              backgroundColor: '#12161f',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#f3f4f6',
              padding: '10px 14px',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value={7}>Последние 7 дней</option>
            <option value={30}>Последние 30 дней</option>
            <option value={90}>Квартал (90 дней)</option>
            <option value={365}>Год</option>
          </select>

          <button
            onClick={loadAnalytics}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: '#161b26',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#f3f4f6',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>
          Расчёт бизнес-показателей...
        </div>
      ) : !data ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#ef4444' }}>
          Не удалось загрузить аналитику
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 1. Главные KPI Карточки */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            <div style={{
              backgroundColor: '#12161f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                <span>Выручка (completed)</span>
                <DollarSign size={18} color="#dfbe7a" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#dfbe7a' }}>
                {data.summary.totalRevenue.toLocaleString('ru-RU')} ₽
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Средний чек: <strong>{data.summary.averageTicket.toLocaleString('ru-RU')} ₽</strong>
              </div>
            </div>

            <div style={{
              backgroundColor: '#12161f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                <span>Всего записей</span>
                <Calendar size={18} color="#c5a059" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f3f4f6' }}>
                {data.summary.totalCount}
              </div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                Выполнено: {data.summary.completedCount} • В ожидании: {data.summary.confirmedCount}
              </div>
            </div>

            <div style={{
              backgroundColor: '#12161f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                <span>Отмены и неявки</span>
                <XCircle size={18} color="#ef4444" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>
                {data.summary.cancelledCount + data.summary.noShowCount}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Отмены: {data.summary.cancellationRate}% • Неявки: {data.summary.noShowRate}%
              </div>
            </div>

            <div style={{
              backgroundColor: '#12161f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                <span>Возвращаемость (Retention)</span>
                <UserCheck size={18} color="#10b981" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
                {data.summary.retentionRate}%
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Повторных гостей: {data.summary.returningClientsCount} из {data.summary.totalClientsCount}
              </div>
            </div>
          </div>

          {/* 2. Популярные услуги и Загрузка мастеров */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Популярные услуги */}
            <div style={{
              backgroundColor: '#12161f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Scissors size={18} color="#c5a059" />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Популярность услуг</h3>
              </div>

              {data.popularServices.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                  Нет выполненных услуг за выбранный период
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.popularServices.map((s: any, idx: number) => {
                    const maxCount = data.popularServices[0].count || 1;
                    const percent = Math.round((s.count / maxCount) * 100);

                    return (
                      <div key={s.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>{idx + 1}. {s.name}</span>
                          <span style={{ color: '#dfbe7a', fontWeight: 700 }}>
                            {s.count} виз. • {s.revenue.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #c5a059, #dfbe7a)',
                            borderRadius: '3px',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Выручка и загрузка барберов */}
            <div style={{
              backgroundColor: '#12161f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Award size={18} color="#dfbe7a" />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Загрузка и выручка мастеров</h3>
              </div>

              {data.barberLoad.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                  Нет данных по мастерам за выбранный период
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.barberLoad.map((b: any, idx: number) => (
                    <div
                      key={b.id}
                      style={{
                        backgroundColor: '#0a0c0f',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#f3f4f6' }}>
                          {b.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                          Выполнено: {b.completedCount} стрижек • ~{Math.round(b.totalMinutes / 60)} ч в кресле
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#dfbe7a' }}>
                          {b.revenue.toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Heatmap «День недели × Час» */}
          <div style={{
            backgroundColor: '#12161f',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Flame size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Тепловая карта загрузки салона (День недели × Час)</h3>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
              Определяет пиковые часы и наиболее популярные промежутки для оптимального планирования смен
            </p>

            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(12, 1fr)', gap: '6px', minWidth: '600px' }}>
                {/* Заголовок часов */}
                <div />
                {hours.map((h) => (
                  <div key={h} style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>
                    {h}:00
                  </div>
                ))}

                {/* Строки дней */}
                {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => (
                  <React.Fragment key={dayIdx}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                      {weekdayLabels[dayIdx]}
                    </div>
                    {hours.map((h) => {
                      const count = data.heatmap[dayIdx]?.[h] || 0;
                      let bg = 'rgba(255, 255, 255, 0.02)';
                      let textColor = '#6b7280';

                      if (count === 1) {
                        bg = 'rgba(197, 160, 89, 0.25)';
                        textColor = '#dfbe7a';
                      } else if (count === 2) {
                        bg = 'rgba(197, 160, 89, 0.55)';
                        textColor = '#0a0c0f';
                      } else if (count >= 3) {
                        bg = 'linear-gradient(135deg, #dfbe7a, #c5a059)';
                        textColor = '#0a0c0f';
                      }

                      return (
                        <div
                          key={h}
                          title={`${weekdayLabels[dayIdx]}, ${h}:00 — записей: ${count}`}
                          style={{
                            height: '36px',
                            backgroundColor: bg.startsWith('linear') ? undefined : bg,
                            background: bg.startsWith('linear') ? bg : undefined,
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: count > 0 ? 700 : 400,
                            color: textColor,
                            transition: 'transform 0.1s ease',
                          }}
                        >
                          {count > 0 ? count : '·'}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
