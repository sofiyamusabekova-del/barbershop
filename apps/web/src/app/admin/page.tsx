'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Search, 
  Filter, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Scissors
} from 'lucide-react';
import { adminGetBookings, adminUpdateBookingStatus, adminGetBarbers } from '../../lib/adminApi';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterBarberId, setFilterBarberId] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    const [bookingsData, barbersData] = await Promise.all([
      adminGetBookings({
        status: filterStatus || undefined,
        barberId: filterBarberId || undefined,
        date: filterDate || undefined,
      }),
      adminGetBarbers(),
    ]);
    setBookings(bookingsData);
    setBarbers(barbersData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterBarberId, filterDate]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const ok = await adminUpdateBookingStatus(id, newStatus);
    if (ok) {
      loadData();
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.client?.name?.toLowerCase().includes(q) ||
      b.client?.phone?.toLowerCase().includes(q) ||
      b.barber?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Заголовок страницы */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'Cinzel, serif', color: '#f3f4f6' }}>
            Управление записями
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
            Контроль текущего потока клиентов, подтверждение и изменение статусов
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#161b26',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#f3f4f6',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          <RefreshCw size={15} /> Обновить список
        </button>
      </div>

      {/* Панель фильтров и поиска */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: '12px',
        backgroundColor: '#12161f',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#0a0c0f',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '0 12px',
        }}>
          <Search size={16} color="#6b7280" />
          <input
            type="text"
            placeholder="Поиск по имени, телефону или мастеру..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#f3f4f6',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            backgroundColor: '#0a0c0f',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#f3f4f6',
            padding: '10px 12px',
            fontSize: '13px',
            outline: 'none',
          }}
        >
          <option value="">Все статусы</option>
          <option value="confirmed">Подтверждена</option>
          <option value="completed">Завершена</option>
          <option value="cancelled">Отменена</option>
          <option value="no_show">Не явился</option>
        </select>

        <select
          value={filterBarberId}
          onChange={(e) => setFilterBarberId(e.target.value)}
          style={{
            backgroundColor: '#0a0c0f',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#f3f4f6',
            padding: '10px 12px',
            fontSize: '13px',
            outline: 'none',
          }}
        >
          <option value="">Все мастера</option>
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{
            backgroundColor: '#0a0c0f',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#f3f4f6',
            padding: '10px 12px',
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </div>

      {/* Таблица записей */}
      <div style={{
        backgroundColor: '#12161f',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
            Загрузка записей...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            Записи не найдены
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0e121a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#9ca3af' }}>
                <th style={{ padding: '16px 20px' }}>Дата и время</th>
                <th style={{ padding: '16px 20px' }}>Клиент</th>
                <th style={{ padding: '16px 20px' }}>Барбер</th>
                <th style={{ padding: '16px 20px' }}>Услуги</th>
                <th style={{ padding: '16px 20px' }}>Сумма</th>
                <th style={{ padding: '16px 20px' }}>Статус</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => {
                const dateStr = new Date(b.startsAt).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const statusStyles: any = {
                  confirmed: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', label: 'Подтверждена' },
                  completed: { bg: 'rgba(197, 160, 89, 0.15)', text: '#c5a059', label: 'Завершена' },
                  cancelled: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Отменена' },
                  no_show: { bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af', label: 'Не явился' },
                };

                const currentStatus = statusStyles[b.status] || statusStyles.confirmed;

                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f3f4f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#c5a059" />
                        {dateStr}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{b.client?.name}</div>
                      <div style={{ color: '#9ca3af', fontSize: '12px' }}>{b.client?.phone}</div>
                    </td>

                    <td style={{ padding: '16px 20px', color: '#c5a059' }}>
                      {b.barber?.name}
                    </td>

                    <td style={{ padding: '16px 20px', maxWidth: '240px' }}>
                      {b.bookingServices?.map((s: any) => s.name).join(', ')}
                    </td>

                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#f3f4f6' }}>
                      {b.totalPrice?.toLocaleString('ru-RU')} ₽
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: currentStatus.bg,
                        color: currentStatus.text,
                      }}>
                        {currentStatus.label}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        style={{
                          backgroundColor: '#0a0c0f',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#f3f4f6',
                          padding: '6px 8px',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      >
                        <option value="confirmed">Подтверждена</option>
                        <option value="completed">Завершить</option>
                        <option value="cancelled">Отменить</option>
                        <option value="no_show">Не явился</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
