'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { adminGetTimeOff, adminCreateTimeOff, adminDeleteTimeOff, adminGetBarbers } from '@/lib/adminApi';

export default function AdminTimeOffPage() {
  const [timeOffs, setTimeOffs] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetBarberId, setTargetBarberId] = useState<string>('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [type, setType] = useState('day_off');
  const [note, setNote] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [timeOffData, barbersData] = await Promise.all([
      adminGetTimeOff(),
      adminGetBarbers(),
    ]);
    setTimeOffs(timeOffData);
    setBarbers(barbersData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startsAt || !endsAt) return;

    await adminCreateTimeOff({
      barberId: targetBarberId || null,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      type,
      note: note.trim() || undefined,
    });

    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить эту запись об отсутствии?')) {
      await adminDeleteTimeOff(id);
      loadData();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'Cinzel, serif', color: '#f3f4f6' }}>
            Выходные и исключения
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
            Планирование отпусков мастеров, больничных или санитарных дней всего салона
          </p>
        </div>

        <button
          onClick={() => {
            setTargetBarberId('');
            setStartsAt('');
            setEndsAt('');
            setType('day_off');
            setNote('');
            setIsModalOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #dfbe7a, #c5a059)',
            color: '#0a0c0f',
            fontWeight: 600,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          <Plus size={18} /> Добавить период
        </button>
      </div>

      <div style={{
        backgroundColor: '#12161f',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
            Загрузка периодов отсутствия...
          </div>
        ) : timeOffs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            Нет запланированных периодов отсутствия
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0e121a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#9ca3af' }}>
                <th style={{ padding: '16px 20px' }}>Объект</th>
                <th style={{ padding: '16px 20px' }}>Тип</th>
                <th style={{ padding: '16px 20px' }}>Период</th>
                <th style={{ padding: '16px 20px' }}>Примечание</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {timeOffs.map((to) => {
                const startStr = new Date(to.startsAt).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const endStr = new Date(to.endsAt).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <tr key={to.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f3f4f6' }}>
                      {to.barber ? to.barber.name : 'Весь салон (закрыто)'}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                      }}>
                        {to.type === 'vacation' ? 'Отпуск' : to.type === 'sick' ? 'Больничный' : to.type === 'maintenance' ? 'Техобслуживание' : 'Выходной'}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', color: '#f3f4f6' }}>
                      {startStr} — {endStr}
                    </td>

                    <td style={{ padding: '16px 20px', color: '#9ca3af' }}>
                      {to.note || '—'}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(to.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '6px',
                          color: '#fca5a5',
                          padding: '6px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal добавления периода */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#12161f',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '28px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
              Добавить период отсутствия
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Для кого
                </label>
                <select
                  value={targetBarberId}
                  onChange={(e) => setTargetBarberId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  <option value="">Весь барбершоп (салон не работает)</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>Барбер: {b.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                    Начало
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#0a0c0f',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                    Окончание
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#0a0c0f',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Тип отсутствия
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  <option value="day_off">Выходной день</option>
                  <option value="vacation">Ежегодный отпуск</option>
                  <option value="sick">Больничный</option>
                  <option value="maintenance">Санитарный день / ремонт</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Примечание (опционально)
                </label>
                <input
                  type="text"
                  placeholder="Причина или пояснение..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#9ca3af',
                    cursor: 'pointer',
                  }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #dfbe7a, #c5a059)',
                    color: '#0a0c0f',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
