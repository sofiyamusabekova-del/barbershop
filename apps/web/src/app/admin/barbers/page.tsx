'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Clock, Calendar, Users, Check, X } from 'lucide-react';
import { adminGetBarbers, adminCreateBarber, adminUpdateBarber, adminUpdateSchedule } from '@/lib/adminApi';

export default function AdminBarbersPage() {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal barber profile
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('Barber');
  const [formBio, setFormBio] = useState('');
  const [formExp, setFormExp] = useState(5);
  const [formPhoto, setFormPhoto] = useState('');

  // Modal schedule
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleBarber, setScheduleBarber] = useState<any | null>(null);
  const [scheduleData, setScheduleData] = useState<{ weekday: number; startTime: string; endTime: string }[]>([]);

  const loadBarbers = async () => {
    setLoading(true);
    const data = await adminGetBarbers();
    setBarbers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBarbers();
  }, []);

  const openEditBarber = (b: any) => {
    setEditingBarber(b);
    setFormName(b.name);
    setFormRole(b.role);
    setFormBio(b.bio);
    setFormExp(b.experienceYears);
    setFormPhoto(b.photoUrl);
    setIsBarberModalOpen(true);
  };

  const openCreateBarber = () => {
    setEditingBarber(null);
    setFormName('');
    setFormRole('Barber');
    setFormBio('');
    setFormExp(3);
    setFormPhoto('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80');
    setIsBarberModalOpen(true);
  };

  const handleSaveBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formName,
      role: formRole,
      bio: formBio,
      experienceYears: Number(formExp),
      photoUrl: formPhoto,
    };

    if (editingBarber) {
      await adminUpdateBarber(editingBarber.id, payload);
    } else {
      await adminCreateBarber(payload);
    }

    setIsBarberModalOpen(false);
    loadBarbers();
  };

  const openScheduleModal = (b: any) => {
    setScheduleBarber(b);
    const weekdays = [0, 1, 2, 3, 4, 5, 6];
    const initial = weekdays.map((day) => {
      const existing = b.workingHours?.find((wh: any) => wh.weekday === day);
      return {
        weekday: day,
        startTime: existing?.startTime || '10:00',
        endTime: existing?.endTime || '22:00',
      };
    });
    setScheduleData(initial);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!scheduleBarber) return;
    await adminUpdateSchedule(scheduleBarber.id, {
      workingHours: scheduleData,
      breaks: [
        { weekday: 0, startTime: '14:00', endTime: '15:00' },
        { weekday: 1, startTime: '14:00', endTime: '15:00' },
        { weekday: 2, startTime: '14:00', endTime: '15:00' },
        { weekday: 3, startTime: '14:00', endTime: '15:00' },
        { weekday: 4, startTime: '14:00', endTime: '15:00' },
        { weekday: 5, startTime: '14:00', endTime: '15:00' },
        { weekday: 6, startTime: '14:00', endTime: '15:00' },
      ],
    });
    setIsScheduleModalOpen(false);
    loadBarbers();
  };

  const weekdayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'Cinzel, serif', color: '#f3f4f6' }}>
            Барберы и график
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
            Управление мастерами, привязкой к Telegram и недельным расписанием
          </p>
        </div>

        <button
          onClick={openCreateBarber}
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
          <Plus size={18} /> Добавить мастера
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {barbers.map((b) => (
          <div
            key={b.id}
            style={{
              backgroundColor: '#12161f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img
                src={b.photoUrl}
                alt={b.name}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #c5a059',
                }}
              />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f3f4f6' }}>{b.name}</h3>
                <span style={{ fontSize: '12px', color: '#c5a059' }}>{b.role}</span>
                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Опыт: {b.experienceYears} лет</p>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5, minHeight: '36px' }}>
              «{b.bio}»
            </p>

            <div style={{
              backgroundColor: '#0a0c0f',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ color: '#6b7280' }}>Telegram-уведомления:</span>
              <span style={{ color: b.telegramChatId ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                {b.telegramChatId ? 'Привязан ✅' : 'Не привязан ⚠️'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
              <button
                onClick={() => openScheduleModal(b)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#1a202c',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Clock size={14} color="#c5a059" /> График
              </button>

              <button
                onClick={() => openEditBarber(b)}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal редактирования профиля барбера */}
      {isBarberModalOpen && (
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
              {editingBarber ? 'Профиль мастера' : 'Новый барбер'}
            </h3>

            <form onSubmit={handleSaveBarber} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Имя и фамилия
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Должность / Квалификация
                </label>
                <input
                  type="text"
                  required
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Опыт (лет)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formExp}
                  onChange={(e) => setFormExp(Number(e.target.value))}
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                  Ссылка на фото (URL)
                </label>
                <input
                  type="url"
                  required
                  value={formPhoto}
                  onChange={(e) => setFormPhoto(e.target.value)}
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
                  Цитата / Краткое кредо
                </label>
                <textarea
                  rows={2}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0a0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsBarberModalOpen(false)}
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

      {/* Modal расписания */}
      {isScheduleModalOpen && scheduleBarber && (
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
            maxWidth: '560px',
            padding: '28px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              Недельный график: {scheduleBarber.name}
            </h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
              Настройте время начала и окончания смен для каждого дня недели
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {scheduleData.map((item, idx) => (
                <div
                  key={item.weekday}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#0a0c0f',
                    padding: '10px 14px',
                    borderRadius: '8px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f3f4f6', width: '130px' }}>
                    {weekdayNames[item.weekday]}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => {
                        const updated = [...scheduleData];
                        updated[idx].startTime = e.target.value;
                        setScheduleData(updated);
                      }}
                      style={{
                        backgroundColor: '#161b26',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#f3f4f6',
                        padding: '6px 10px',
                        fontSize: '13px',
                      }}
                    />
                    <span style={{ color: '#6b7280' }}>—</span>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => {
                        const updated = [...scheduleData];
                        updated[idx].endTime = e.target.value;
                        setScheduleData(updated);
                      }}
                      style={{
                        backgroundColor: '#161b26',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#f3f4f6',
                        padding: '6px 10px',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
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
                type="button"
                onClick={handleSaveSchedule}
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
                Сохранить расписание
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
