import React, { useEffect, useState } from 'react';
import { 
  ApiService, 
  ApiBarber, 
  ApiTimeSlot, 
  ApiBooking,
  fetchServices, 
  fetchBarbers, 
  fetchAvailability, 
  createBooking, 
  authenticateTelegram, 
  fetchMyBookings,
  cancelBookingByToken,
  rescheduleBookingByToken
} from './lib/api';
import { 
  initTelegramApp, 
  getTelegramInitData, 
  getTelegramUser, 
  triggerHaptic, 
  showTelegramConfirm,
  showTelegramAlert
} from './lib/telegram';
import { 
  Scissors, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  AlertCircle,
  Phone,
  BookmarkCheck,
  RefreshCw,
  XCircle,
  History,
  PlusCircle,
  CalendarCheck2
} from 'lucide-react';

type Tab = 'book' | 'my-bookings';
type BookingStep = 'services' | 'barber' | 'datetime' | 'contacts' | 'confirmation';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('book');
  const [step, setStep] = useState<BookingStep>('services');

  // Telegram User State
  const [tgUser, setTgUser] = useState<any>(null);
  const [dbClient, setDbClient] = useState<any>(null);

  // Data State
  const [services, setServices] = useState<ApiService[]>([]);
  const [barbers, setBarbers] = useState<ApiBarber[]>([]);
  const [myBookings, setMyBookings] = useState<ApiBooking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking Flow State
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<ApiTimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ApiTimeSlot | null>(null);

  // Contact info
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  // Result State
  const [createdBooking, setCreatedBooking] = useState<ApiBooking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reschedule modal/state
  const [rescheduleBooking, setRescheduleBooking] = useState<ApiBooking | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<ApiTimeSlot[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<ApiTimeSlot | null>(null);
  const [reschedulingLoading, setReschedulingLoading] = useState(false);

  // 1. Инициализация Telegram SDK и загрузка данных
  useEffect(() => {
    initTelegramApp();

    const initData = getTelegramInitData();
    const unsafeUser = getTelegramUser();

    if (unsafeUser) {
      setTgUser(unsafeUser);
      const fullName = [unsafeUser.first_name, unsafeUser.last_name].filter(Boolean).join(' ');
      setClientName(fullName || unsafeUser.username || '');
    }

    async function loadInitial() {
      setLoadingData(true);
      try {
        const [servicesData, barbersData] = await Promise.all([
          fetchServices(),
          fetchBarbers(),
        ]);
        setServices(servicesData);
        setBarbers(barbersData);

        // Попробуем аутентифицировать через API
        if (initData) {
          const authRes = await authenticateTelegram(initData);
          if (authRes.success && authRes.client) {
            setDbClient(authRes.client);
            if (authRes.client.name) setClientName(authRes.client.name);
            if (authRes.client.phone) setClientPhone(authRes.client.phone);
          }
        }
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setLoadingData(false);
      }
    }

    loadInitial();
  }, []);

  // 2. Загрузка записей пользователя при переключении на таб "Мои записи"
  useEffect(() => {
    if (activeTab === 'my-bookings') {
      loadBookingsList();
    }
  }, [activeTab, tgUser, dbClient]);

  async function loadBookingsList() {
    if (!tgUser?.id && !dbClient?.id && !clientPhone) return;
    const list = await fetchMyBookings({
      telegramId: tgUser?.id || dbClient?.telegramId,
      phone: clientPhone || dbClient?.phone,
    });
    setMyBookings(list);
  }

  // 3. Загрузка слотов при смене даты / мастера / услуг
  useEffect(() => {
    if (step === 'datetime' && selectedServiceIds.length > 0 && selectedDate) {
      loadSlots(selectedDate, selectedBarberId);
    }
  }, [step, selectedDate, selectedBarberId, selectedServiceIds]);

  async function loadSlots(date: string, barberId: string) {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const slots = await fetchAvailability({
        serviceIds: selectedServiceIds,
        barberId: barberId === 'any' ? undefined : barberId,
        date,
      });
      setAvailableSlots(slots);
    } catch (e) {
      console.error(e);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  // Калькуляция цен и времени выбранных услуг
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  // Хэндлеры выбора
  const toggleService = (id: string) => {
    triggerHaptic('light');
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectBarber = (id: string) => {
    triggerHaptic('light');
    setSelectedBarberId(id);
  };

  // Создание бронирования
  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMessage('Пожалуйста, укажите ваше имя и телефон');
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    triggerHaptic('medium');

    try {
      const payload = {
        serviceIds: selectedServiceIds,
        barberId: selectedBarberId,
        startsAt: selectedSlot.startsAt,
        client: {
          name: clientName.trim(),
          phone: clientPhone.trim(),
        },
        comment: comment.trim() || undefined,
        source: 'telegram' as const,
      };

      const result = await createBooking(payload);

      if (result.success && result.data) {
        triggerHaptic('success');
        setCreatedBooking(result.data);
        setStep('confirmation');
      } else {
        triggerHaptic('error');
        if (result.error?.code === 'SLOT_TAKEN') {
          setErrorMessage('Этот слот уже занят другим клиентом. Выберите другое время.');
          setStep('datetime');
        } else {
          setErrorMessage(result.error?.message || 'Не удалось создать запись');
        }
      }
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMessage(err.message || 'Ошибка связи с сервером');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Отмена записи
  const handleCancelBooking = async (booking: ApiBooking) => {
    const confirmed = await showTelegramConfirm(
      `Вы действительно хотите отменить запись на ${new Date(booking.startsAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}?`
    );
    if (!confirmed) return;

    triggerHaptic('warning');
    const res = await cancelBookingByToken(booking.manageToken);
    if (res.success) {
      triggerHaptic('success');
      await showTelegramAlert('Запись успешно отменена');
      loadBookingsList();
    } else {
      triggerHaptic('error');
      await showTelegramAlert(res.error || 'Ошибка при отмене');
    }
  };

  // Инициализация переноса
  const openRescheduleModal = async (booking: ApiBooking) => {
    setRescheduleBooking(booking);
    const today = new Date().toISOString().split('T')[0];
    setRescheduleDate(today);
    setSelectedRescheduleSlot(null);
    setReschedulingLoading(true);

    const sIds = booking.bookingServices?.map((s) => s.serviceId) || [];
    const slots = await fetchAvailability({
      serviceIds: sIds,
      barberId: booking.barberId,
      date: today,
    });
    setRescheduleSlots(slots);
    setReschedulingLoading(false);
  };

  const handleRescheduleDateChange = async (date: string) => {
    setRescheduleDate(date);
    if (!rescheduleBooking) return;
    setReschedulingLoading(true);
    setSelectedRescheduleSlot(null);
    const sIds = rescheduleBooking.bookingServices?.map((s) => s.serviceId) || [];
    const slots = await fetchAvailability({
      serviceIds: sIds,
      barberId: rescheduleBooking.barberId,
      date,
    });
    setRescheduleSlots(slots);
    setReschedulingLoading(false);
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleBooking || !selectedRescheduleSlot) return;
    triggerHaptic('medium');
    const res = await rescheduleBookingByToken(rescheduleBooking.manageToken, selectedRescheduleSlot.startsAt);
    if (res.success) {
      triggerHaptic('success');
      await showTelegramAlert('Запись успешно перенесена!');
      setRescheduleBooking(null);
      loadBookingsList();
    } else {
      triggerHaptic('error');
      await showTelegramAlert(res.error || 'Не удалось перенести запись');
    }
  };

  // Сброс и новая запись
  const handleResetFlow = () => {
    setSelectedServiceIds([]);
    setSelectedBarberId('any');
    setSelectedSlot(null);
    setCreatedBooking(null);
    setErrorMessage(null);
    setStep('services');
  };

  return (
    <div style={{ paddingBottom: 'calc(var(--safe-bottom) + 80px)', minHeight: '100vh' }}>
      {/* Верхняя панель бренда */}
      <header style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(13, 15, 18, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #dfbe7a, #c5a059)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0d0f12',
            fontWeight: 800,
          }}>
            <Scissors size={20} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', letterSpacing: '1px', fontWeight: 700 }}>
              CHOP & CRAFT
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Премиальный барбершоп
            </p>
          </div>
        </div>

        {tgUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            color: 'var(--gold)',
          }}>
            <User size={14} />
            <span>{tgUser.first_name || 'Клиент'}</span>
          </div>
        )}
      </header>

      {/* Основной контент */}
      <main style={{ padding: '16px 20px' }}>
        {/* Сообщение об ошибке */}
        {errorMessage && (
          <div className="glass-card animate-fade-in" style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderLeft: '4px solid var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fca5a5',
            fontSize: '13px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: ЗАПИСЬ */}
        {activeTab === 'book' && (
          <div>
            {/* Step Bar */}
            {step !== 'confirmation' && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                {(['services', 'barber', 'datetime', 'contacts'] as BookingStep[]).map((s, idx) => {
                  const stepIndex = ['services', 'barber', 'datetime', 'contacts'].indexOf(step);
                  const isPassed = stepIndex >= idx;
                  const isCurrent = step === s;
                  return (
                    <div
                      key={s}
                      style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        background: isCurrent ? 'var(--gold)' : isPassed ? 'rgba(197, 160, 89, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* ШАГ 1: ВЫБОР УСЛУГ */}
            {step === 'services' && (
              <div className="animate-fade-in">
                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Выберите услуги</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Можно выбрать одну или несколько процедур
                  </p>
                </div>

                {loadingData ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 12px' }} />
                    <p>Загрузка каталога услуг...</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {services.map((srv) => {
                      const isSelected = selectedServiceIds.includes(srv.id);
                      return (
                        <div
                          key={srv.id}
                          onClick={() => toggleService(srv.id)}
                          className="glass-card"
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            borderColor: isSelected ? 'var(--gold)' : 'var(--border)',
                            background: isSelected ? 'rgba(197, 160, 89, 0.12)' : 'var(--bg-card)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{srv.name}</h3>
                              {isSelected && <CheckCircle2 size={16} color="var(--gold)" />}
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
                              {srv.description}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={13} /> {srv.durationMin} мин
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold-light)' }}>
                              {srv.price.toLocaleString('ru-RU')} ₽
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ШАГ 2: ВЫБОР БАРБЕРА */}
            {step === 'barber' && (
              <div className="animate-fade-in">
                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Выберите барбера</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Наши мастера имеют опыт работы от 4 до 9 лет
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Вариант «Любой свободный» */}
                  <div
                    onClick={() => handleSelectBarber('any')}
                    className="glass-card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderColor: selectedBarberId === 'any' ? 'var(--gold)' : 'var(--border)',
                      background: selectedBarberId === 'any' ? 'rgba(197, 160, 89, 0.12)' : 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(197,160,89,0.3), rgba(255,255,255,0.05))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--gold)',
                    }}>
                      <Sparkles size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Любой свободный мастер</h3>
                        {selectedBarberId === 'any' && <CheckCircle2 size={16} color="var(--gold)" />}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Система подберет ближайшее доступное время
                      </p>
                    </div>
                  </div>

                  {barbers.map((b) => {
                    const isSelected = selectedBarberId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => handleSelectBarber(b.id)}
                        className="glass-card"
                        style={{
                          padding: '14px 16px',
                          cursor: 'pointer',
                          borderColor: isSelected ? 'var(--gold)' : 'var(--border)',
                          background: isSelected ? 'rgba(197, 160, 89, 0.12)' : 'var(--bg-card)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                        }}
                      >
                        <img
                          src={b.photoUrl}
                          alt={b.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: isSelected ? '2px solid var(--gold)' : '1px solid var(--border)',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{b.name}</h3>
                            {isSelected && <CheckCircle2 size={16} color="var(--gold)" />}
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--gold)' }}>{b.role}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Опыт {b.experienceYears} лет</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ШАГ 3: ДАТА И ВРЕМЯ */}
            {step === 'datetime' && (
              <div className="animate-fade-in">
                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Дата и время</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Мастер: <strong style={{ color: 'var(--gold)' }}>{selectedBarberId === 'any' ? 'Любой свободный' : selectedBarber?.name}</strong>
                  </p>
                </div>

                {/* Выбор даты */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Выберите день:
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      triggerHaptic('light');
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '15px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Сетка времени */}
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                    Доступные слоты:
                  </label>

                  {loadingSlots ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                      <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '13px' }}>Поиск свободных окон...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <Calendar size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <p style={{ fontSize: '14px' }}>На эту дату нет свободных слотов</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Попробуйте выбрать другой день или мастера
                      </p>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                    }}>
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlot?.startsAt === slot.startsAt;
                        return (
                          <button
                            key={slot.startsAt}
                            onClick={() => {
                              triggerHaptic('light');
                              setSelectedSlot(slot);
                            }}
                            type="button"
                            style={{
                              padding: '12px 6px',
                              background: isSelected ? 'linear-gradient(135deg, #dfbe7a, #c5a059)' : 'rgba(255, 255, 255, 0.04)',
                              color: isSelected ? '#0b0d10' : 'var(--text-primary)',
                              border: isSelected ? 'none' : '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 600,
                              fontSize: '14px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ШАГ 4: КОНТАКТЫ И ИТОГ */}
            {step === 'contacts' && (
              <div className="animate-fade-in">
                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Подтверждение записи</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Проверьте детали и оставьте контакты для связи
                  </p>
                </div>

                {/* Сводка */}
                <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--gold)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Детали визита
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Услуги:</span>
                      <span style={{ fontWeight: 600, textAlign: 'right' }}>
                        {selectedServices.map((s) => s.name).join(', ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Барбер:</span>
                      <span style={{ fontWeight: 600 }}>
                        {selectedBarberId === 'any' ? 'Любой свободный' : selectedBarber?.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Дата и время:</span>
                      <span style={{ fontWeight: 600, color: 'var(--gold-light)' }}>
                        {selectedSlot ? new Date(selectedSlot.startsAt).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Длительность:</span>
                      <span>~{totalDuration} минут</span>
                    </div>
                    <div style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: '8px',
                      marginTop: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '15px',
                      fontWeight: 700,
                    }}>
                      <span>Итого к оплате:</span>
                      <span style={{ color: 'var(--gold-light)' }}>{totalPrice.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                </div>

                {/* Форма контактов */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Ваше имя *
                    </label>
                    <input
                      type="text"
                      placeholder="Иван"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Номер телефона *
                    </label>
                    <input
                      type="tel"
                      placeholder="+7 999 000-00-00"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Пожелание или комментарий (опционально)
                    </label>
                    <textarea
                      placeholder="Например: хочу переход с нуля или классический фейд"
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ШАГ 5: УСПЕХ БРОНИРОВАНИЯ */}
            {step === 'confirmation' && createdBooking && (
              <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <BookmarkCheck size={36} />
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                  Вы успешно записаны!
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Ждём вас в барбершопе Chop & Craft
                </p>

                <div className="glass-card" style={{ padding: '20px', textAlign: 'left', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Барбер:</span>
                      <span style={{ fontWeight: 600 }}>{createdBooking.barber?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Дата и время:</span>
                      <span style={{ fontWeight: 600, color: 'var(--gold-light)' }}>
                        {new Date(createdBooking.startsAt).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Сумма:</span>
                      <span style={{ fontWeight: 700 }}>{createdBooking.totalPrice} ₽</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Адрес:</span>
                      <span>ул. Большая Никитская, 24</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveTab('my-bookings');
                    }}
                    className="btn-gold"
                    type="button"
                  >
                    <History size={18} /> Перейти в «Мои записи»
                  </button>

                  <button
                    onClick={handleResetFlow}
                    className="btn-outline"
                    type="button"
                  >
                    <PlusCircle size={18} /> Записаться ещё раз
                  </button>
                </div>
              </div>
            )}

            {/* Навигационные кнопки внизу потока бронирования */}
            {step !== 'confirmation' && (
              <div style={{
                marginTop: '24px',
                display: 'flex',
                gap: '10px',
              }}>
                {step !== 'services' && (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      if (step === 'barber') setStep('services');
                      if (step === 'datetime') setStep('barber');
                      if (step === 'contacts') setStep('datetime');
                    }}
                    type="button"
                    className="btn-outline"
                    style={{ flex: 1 }}
                  >
                    <ChevronLeft size={18} /> Назад
                  </button>
                )}

                <button
                  onClick={() => {
                    if (step === 'services') {
                      if (selectedServiceIds.length === 0) {
                        setErrorMessage('Пожалуйста, выберите хотя бы одну услугу');
                        triggerHaptic('error');
                        return;
                      }
                      setErrorMessage(null);
                      triggerHaptic('light');
                      setStep('barber');
                    } else if (step === 'barber') {
                      triggerHaptic('light');
                      setStep('datetime');
                    } else if (step === 'datetime') {
                      if (!selectedSlot) {
                        setErrorMessage('Пожалуйста, выберите время визита');
                        triggerHaptic('error');
                        return;
                      }
                      setErrorMessage(null);
                      triggerHaptic('light');
                      setStep('contacts');
                    } else if (step === 'contacts') {
                      handleConfirmBooking();
                    }
                  }}
                  disabled={isSubmitting || (step === 'services' && selectedServiceIds.length === 0)}
                  type="button"
                  className="btn-gold"
                  style={{ flex: 2 }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} /> Запись...
                    </>
                  ) : step === 'contacts' ? (
                    <>
                      Подтвердить запись <CheckCircle2 size={18} />
                    </>
                  ) : (
                    <>
                      Далее <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: МОИ ЗАПИСИ */}
        {activeTab === 'my-bookings' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>История записей</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Управление визитами, перенос и отмена
                </p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  loadBookingsList();
                }}
                className="btn-outline"
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                <RefreshCw size={14} /> Обновить
              </button>
            </div>

            {myBookings.length === 0 ? (
              <div className="glass-card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <CalendarCheck2 size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  У вас пока нет активных записей
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Оформите новую запись прямо сейчас
                </p>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    handleResetFlow();
                    setActiveTab('book');
                  }}
                  className="btn-gold"
                  style={{ margin: '0 auto' }}
                >
                  <PlusCircle size={18} /> Записаться к мастеру
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myBookings.map((b) => {
                  const isConfirmed = b.status === 'confirmed';
                  const isCancelled = b.status === 'cancelled';
                  const isCompleted = b.status === 'completed';

                  return (
                    <div key={b.id} className="glass-card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: isConfirmed ? 'rgba(16, 185, 129, 0.15)' : isCancelled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                              color: isConfirmed ? 'var(--accent-green)' : isCancelled ? 'var(--accent-red)' : 'var(--text-muted)',
                            }}>
                              {isConfirmed ? 'Подтверждена' : isCancelled ? 'Отменена' : isCompleted ? 'Завершена' : b.status}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '15px', fontWeight: 600 }}>
                            {b.bookingServices?.map((s) => s.name).join(', ') || 'Комплекс услуг'}
                          </h4>
                          <p style={{ fontSize: '12px', color: 'var(--gold)' }}>
                            Барбер: {b.barber?.name}
                          </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700 }}>{b.totalPrice} ₽</span>
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: isConfirmed ? 'var(--gold-light)' : 'var(--text-muted)',
                        marginBottom: isConfirmed ? '12px' : '0',
                      }}>
                        <Clock size={15} />
                        <span>
                          {new Date(b.startsAt).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            weekday: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Кнопки управления confirmed записью */}
                      {isConfirmed && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button
                            onClick={() => openRescheduleModal(b)}
                            className="btn-outline"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                          >
                            <RefreshCw size={13} /> Перенести
                          </button>
                          <button
                            onClick={() => handleCancelBooking(b)}
                            className="btn-outline"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '12px', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          >
                            <XCircle size={13} /> Отменить
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Модалка переноса записи */}
      {rescheduleBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end',
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '24px 20px calc(var(--safe-bottom) + 20px)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Перенос записи</h3>
              <button
                onClick={() => setRescheduleBooking(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Выберите новую дату для визита к барберу {rescheduleBooking.barber?.name}:
            </p>

            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={rescheduleDate}
              onChange={(e) => handleRescheduleDateChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '16px',
              }}
            />

            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Доступное время:
            </label>

            {reschedulingLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <RefreshCw className="animate-spin" size={20} style={{ margin: '0 auto 6px' }} />
                <p style={{ fontSize: '12px' }}>Загрузка слотов...</p>
              </div>
            ) : rescheduleSlots.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                На выбранную дату нет свободных слотов
              </p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '20px',
              }}>
                {rescheduleSlots.map((slot) => {
                  const isSelected = selectedRescheduleSlot?.startsAt === slot.startsAt;
                  return (
                    <button
                      key={slot.startsAt}
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedRescheduleSlot(slot);
                      }}
                      type="button"
                      style={{
                        padding: '10px 4px',
                        background: isSelected ? 'linear-gradient(135deg, #dfbe7a, #c5a059)' : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? '#0b0d10' : 'var(--text-primary)',
                        border: isSelected ? 'none' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setRescheduleBooking(null)}
                className="btn-outline"
                style={{ flex: 1 }}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={!selectedRescheduleSlot}
                className="btn-gold"
                style={{ flex: 2 }}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Нижний Tab Bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(64px + var(--safe-bottom))',
        paddingBottom: 'var(--safe-bottom)',
        background: 'rgba(13, 15, 18, 0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 40,
      }}>
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('book');
          }}
          style={{
            flex: 1,
            height: '100%',
            background: 'none',
            border: 'none',
            color: activeTab === 'book' ? 'var(--gold)' : 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: activeTab === 'book' ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          <Scissors size={20} />
          <span>Запись</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('my-bookings');
          }}
          style={{
            flex: 1,
            height: '100%',
            background: 'none',
            border: 'none',
            color: activeTab === 'my-bookings' ? 'var(--gold)' : 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: activeTab === 'my-bookings' ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          <History size={20} />
          <span>Мои записи</span>
        </button>
      </nav>
    </div>
  );
}
