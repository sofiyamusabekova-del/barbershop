'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Phone,
  Send
} from 'lucide-react';
import {
  fetchBookingByToken,
  cancelBooking,
  rescheduleBooking,
  fetchAvailability,
  ApiBooking,
  ApiTimeSlot
} from '../../../lib/api';
import { brandInfo } from '../../../data/brandData';
import styles from './BookingToken.module.css';

interface BookingTokenClientProps {
  token: string;
}

export function BookingTokenClient({ token }: BookingTokenClientProps) {
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<ApiTimeSlot[]>([]);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchBookingByToken(token);
      setBooking(data);
      setLoading(false);
      if (data) {
        // Устанавливаем следующий день по умолчанию для переноса
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setNewDate(tomorrow.toISOString().split('T')[0]);
      }
    }
    load();
  }, [token]);

  // Загрузка слотов при смене даты для переноса
  useEffect(() => {
    async function loadRescheduleSlots() {
      if (!booking || !isRescheduling || !newDate) return;
      setLoadingSlots(true);
      const serviceIds = booking.bookingServices?.map((s) => s.serviceId) || [];
      const slots = await fetchAvailability({
        serviceIds,
        barberId: booking.barberId,
        date: newDate,
      });
      setAvailableSlots(slots);
      if (slots.length > 0) {
        setSelectedSlotTime(slots[0].time);
      } else {
        setSelectedSlotTime('');
      }
      setLoadingSlots(false);
    }
    loadRescheduleSlots();
  }, [booking, isRescheduling, newDate]);

  const handleCancel = async () => {
    if (!confirm('Вы уверены, что хотите отменить эту запись?')) return;
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    const res = await cancelBooking(token);
    setActionLoading(false);

    if (res.success) {
      setActionSuccess('Запись успешно отменена.');
      setBooking((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    } else {
      setActionError(res.error || 'Не удалось отменить запись.');
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedSlotTime) {
      setActionError('Выберите свободное время для переноса');
      return;
    }

    const chosen = availableSlots.find((s) => s.time === selectedSlotTime);
    const startsAt = chosen ? chosen.startsAt : `${newDate}T${selectedSlotTime}:00.000Z`;

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    const res = await rescheduleBooking(token, startsAt);
    setActionLoading(false);

    if (res.success) {
      setActionSuccess(`Запись успешно перенесена на ${newDate} в ${selectedSlotTime}!`);
      setIsRescheduling(false);
      const updated = await fetchBookingByToken(token);
      setBooking(updated);
    } else {
      setActionError(res.error || 'Не удалось перенести запись.');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
        <p>Загрузка деталей записи...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Запись не найдена</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '32px' }}>
          Возможно, ссылка устарела или токен бронирования указан неверно.
        </p>
        <Link href="/book" className="btn-cinematic">
          Записаться заново
        </Link>
      </div>
    );
  }

  const startsDate = new Date(booking.startsAt);
  const formattedDate = startsDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = startsDate.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isCancelled = booking.status === 'cancelled';

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Главная</span>
          </Link>
          <div className={styles.headerTitle}>
            <span>{brandInfo.name}</span> • Управление записью
          </div>
          <div className={styles.phoneLink}>{brandInfo.phone}</div>
        </div>
      </header>

      <main className="container" style={{ marginTop: '40px', maxWidth: '720px' }}>
        {actionError && (
          <div className={styles.alertError}>
            <AlertTriangle size={18} />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className={styles.alertSuccess}>
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
        )}

        <div className={styles.ticketCard}>
          <div className={styles.ticketHead}>
            <div>
              <div className="editorial-tag">Ваш визит</div>
              <h1 className={styles.ticketTitle}>Электронный талон</h1>
            </div>
            <div className={`${styles.statusBadge} ${isCancelled ? styles.statusCancelled : styles.statusConfirmed}`}>
              {isCancelled ? 'Отменена' : 'Подтверждена'}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><User size={14} /> Клиент</span>
              <span className={styles.detailValue}>{booking.client?.name || 'Гость'}</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><Phone size={14} /> Телефон</span>
              <span className={styles.detailValue}>{booking.client?.phone}</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><Calendar size={14} /> Дата визита</span>
              <span className={styles.detailValue}>{formattedDate}</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><Clock size={14} /> Время</span>
              <span className={styles.detailValueHighlight}>{formattedTime} ({booking.totalDurationMin} мин)</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}><Scissors size={14} /> Мастер</span>
              <span className={styles.detailValue}>{booking.barber?.name}</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>К оплате на месте</span>
              <span className={styles.detailPrice}>{booking.totalPrice.toLocaleString('ru-RU')} сум</span>
            </div>
          </div>

          {booking.bookingServices && booking.bookingServices.length > 0 && (
            <div className={styles.servicesBox}>
              <div className={styles.servicesBoxTitle}>Выбранные услуги:</div>
              {booking.bookingServices.map((s) => (
                <div key={s.id} className={styles.serviceRow}>
                  <span>{s.name}</span>
                  <span>{s.price.toLocaleString('ru-RU')} сум</span>
                </div>
              ))}
            </div>
          )}

          {/* Режим переноса даты/времени */}
          {isRescheduling && !isCancelled && (
            <div className={styles.reschedulePanel}>
              <h3 className={styles.rescheduleTitle}>Выберите новую дату и время:</h3>

              <div style={{ marginBottom: '16px' }}>
                <label className={styles.detailLabel}>Новая дата:</label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>

              <div>
                <label className={styles.detailLabel}>Свободные слоты:</label>
                {loadingSlots ? (
                  <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Поиск слотов...</p>
                ) : availableSlots.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>На эту дату слотов нет</p>
                ) : (
                  <div className={styles.slotsGrid}>
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        className={`${styles.slotBtn} ${slot.time === selectedSlotTime ? styles.slotActive : ''}`}
                        onClick={() => setSelectedSlotTime(slot.time)}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.rescheduleActions}>
                <button
                  type="button"
                  onClick={handleRescheduleSubmit}
                  className="btn-cinematic"
                  disabled={actionLoading || !selectedSlotTime}
                >
                  {actionLoading ? 'Переносим...' : 'Подтвердить перенос'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="btn-secondary"
                  disabled={actionLoading}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Действия управления записью */}
          {!isCancelled && !isRescheduling && (
            <div className={styles.cardActions}>
              <button
                type="button"
                onClick={() => setIsRescheduling(true)}
                className="btn-cinematic"
                disabled={actionLoading}
              >
                <RotateCcw size={16} />
                Перенести запись
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className={styles.cancelBtn}
                disabled={actionLoading}
              >
                <XCircle size={16} />
                Отменить запись
              </button>
            </div>
          )}

          {isCancelled && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Link href="/book" className="btn-cinematic">
                Записаться снова
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
