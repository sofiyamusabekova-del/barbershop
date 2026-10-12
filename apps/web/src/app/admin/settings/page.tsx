'use client';

import React, { useEffect, useState } from 'react';
import { Save, Check, Settings as SettingsIcon } from 'lucide-react';
import { adminGetSettings, adminUpdateSettings } from '@/lib/adminApi';

export default function AdminSettingsPage() {
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await adminGetSettings();
      setSettingsList(data);
      const initial: Record<string, string> = {};
      data.forEach((s: any) => {
        initial[s.key] = s.value;
      });
      setFormValues(initial);
      setLoading(false);
    }
    load();
  }, []);

  const handleChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await adminUpdateSettings(formValues);
    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const labelsMap: Record<string, { label: string; desc: string; type?: string }> = {
    timezone: { label: 'Часовой пояс', desc: 'Основной часовой пояс работы барбершопа' },
    slot_step_min: { label: 'Шаг времени в сетке (минуты)', desc: 'Интервал между слотами для выбора времени' },
    booking_horizon_days: { label: 'Горизонт бронирования (дней)', desc: 'На сколько дней вперед открыта запись' },
    min_notice_min: { label: 'Минимальное время до визита (минуты)', desc: 'Запрет бронирования за N минут до старта' },
    cancel_cutoff_min: { label: 'Дедлайн отмены клиентом (минуты)', desc: 'Менее чем за N минут отмена только через звонок' },
    reminder_day_minutes: { label: 'Первое напоминание (минуты до визита)', desc: 'Обычно за 24 часа (1440 минут)' },
    reminder_short_minutes: { label: 'Второе напоминание (минуты до визита)', desc: 'Обычно за 30-120 минут' },
    review_delay_min: { label: 'Задержка запроса отзыва (минуты)', desc: 'Через сколько минут после визита спросить оценку' },
  };

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'Cinzel, serif', color: '#f3f4f6' }}>
          Настройки салона
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
          Конфигурация бизнес-правил, таймингов слотов и автоматических напоминаний
        </p>
      </div>

      {savedSuccess && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderLeft: '4px solid #10b981',
          padding: '12px 16px',
          borderRadius: '8px',
          color: '#10b981',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
        }}>
          <Check size={16} /> Настройки успешно сохранены и применены в системе!
        </div>
      )}

      <form onSubmit={handleSave} style={{
        backgroundColor: '#12161f',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            Загрузка параметров...
          </div>
        ) : (
          Object.keys(formValues).map((key) => {
            const meta = labelsMap[key] || { label: key, desc: '' };
            return (
              <div key={key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              }}>
                <div style={{ maxWidth: '400px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#f3f4f6', display: 'block' }}>
                    {meta.label}
                  </label>
                  {meta.desc && (
                    <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', display: 'block' }}>
                      {meta.desc}
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={formValues[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={{
                    width: '180px',
                    padding: '8px 12px',
                    backgroundColor: '#0a0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#c5a059',
                    fontWeight: 600,
                    fontSize: '14px',
                    textAlign: 'right',
                    outline: 'none',
                  }}
                />
              </div>
            );
          })
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #dfbe7a, #c5a059)',
              color: '#0a0c0f',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <Save size={16} /> Сохранить изменения
          </button>
        </div>
      </form>
    </div>
  );
}
