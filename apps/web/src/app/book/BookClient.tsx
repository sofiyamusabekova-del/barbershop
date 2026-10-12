'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  User,
  Calendar as CalendarIcon,
  Phone,
  Sparkles,
  Scissors,
  Check,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { editorialServices, barbersList, brandInfo, ServiceItem, BarberItem } from '../../data/brandData';
import { fetchServices, fetchBarbers, fetchAvailability, createBooking, ApiTimeSlot, ApiBooking } from '../../lib/api';
import styles from './BookClient.module.css';

// Тестовые слоты согласно заданию
const MOCK_SLOTS: string[] = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:30', '18:00', '19:30'];

// Опция "Любой свободный"
const ANY_BARBER: BarberItem = {
  id: 'any',
  name: 'Любой свободный мастер',
  role: 'Автоматический подбор',
  experience: 'Все мастера подтвержденной квалификации',
  quote: 'Мы назначим ближайшего свободного профильного мастера на выбранное вами время.',
  photoUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=700&q=80',
  specialties: ['Быстрая посадка', 'Гарантия стандарта', 'Любые техники'],
};

// Генерация ближайших 7 дней
interface DateOption {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: string;
  dayOfMonth: number;
  monthName: string;
  isToday: boolean;
}

function getNextDays(count = 7): DateOption[] {
  const days: DateOption[] = [];
  const now = new Date();
  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dayOfWeek = weekDays[d.getDay()];
    const dayOfMonth = d.getDate();
    const monthName = months[d.getMonth()];
    const dateStr = d.toISOString().split('T')[0];

    days.push({
      dateStr,
      dayOfWeek,
      dayOfMonth,
      monthName,
      isToday: i === 0,
    });
  }
  return days;
}

export function BookClient() {
  // Steps: 1: Услуга, 2: Барбер, 3: Дата и Время, 4: Контакты, 5: Подтверждение
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [services, setServices] = useState<ServiceItem[]>(editorialServices);
  const [barbers, setBarbers] = useState<BarberItem[]>(barbersList);

  useEffect(() => {
    async function loadData() {
      try {
        const [apiServices, apiBarbers] = await Promise.all([
          fetchServices(),
          fetchBarbers(),
        ]);

        if (apiServices && apiServices.length > 0) {
          const mappedServices: ServiceItem[] = apiServices.map((s, idx) => {
            const fallback = editorialServices[idx] || editorialServices[0];
            return {
              id: s.id,
              index: String(idx + 1).padStart(2, '0'),
              name: s.name,
              description: s.description,
              durationMin: s.durationMin,
              priceUzs: s.price,
              priceFormatted: `${s.price.toLocaleString('ru-RU')} сум`,
              category: (s.category as any) || fallback.category,
              image: fallback.image,
            };
          });
          setServices(mappedServices);
          setSelectedServiceId(mappedServices[0].id);
        }

        if (apiBarbers && apiBarbers.length > 0) {
          const mappedBarbers: BarberItem[] = apiBarbers.map((b, idx) => {
            const fallback = barbersList[idx] || barbersList[0];
            return {
              id: b.id,
              name: b.name,
              role: b.role,
              experience: `${b.experienceYears} лет практики`,
              quote: b.bio || fallback.quote,
              photoUrl: b.photoUrl,
              specialties: fallback.specialties,
            };
          });
          setBarbers(mappedBarbers);
        }
      } catch (err) {
        console.error('Ошибка загрузки данных для записи:', err);
      }
    }

    loadData();
  }, []);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(editorialServices[0].id);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any');
  
  const dateOptions = useMemo(() => getNextDays(7), []);
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].dateStr);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [realSlots, setRealSlots] = useState<ApiTimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('+998 ');
  const [clientComment, setClientComment] = useState<string>('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdBooking, setCreatedBooking] = useState<ApiBooking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{ name?: string; phone?: string }>({});

  // Загрузка реальных доступных слотов с бэкенда Fastify
  useEffect(() => {
    async function loadSlots() {
      if (!selectedServiceId || !selectedDate) return;
      setLoadingSlots(true);
      try {
        const slots = await fetchAvailability({
          serviceIds: [selectedServiceId],
          barberId: selectedBarberId,
          date: selectedDate,
        });
        setRealSlots(slots);
        if (slots.length > 0) {
          setSelectedTime(slots[0].time);
        } else {
          setSelectedTime('');
        }
      } catch (err) {
        console.error('Ошибка загрузки слотов:', err);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [selectedServiceId, selectedBarberId, selectedDate]);

  // Resolved entities
  const currentService = services.find((s) => s.id === selectedServiceId) || services[0];
  const allBarbers = [ANY_BARBER, ...barbers];
  const currentBarber = allBarbers.find((b) => b.id === selectedBarberId) || ANY_BARBER;

  const selectedDateObj = dateOptions.find((d) => d.dateStr === selectedDate) || dateOptions[0];

  // Validation
  const validateContacts = (): boolean => {
    const errs: { name?: string; phone?: string } = {};
    if (!clientName.trim() || clientName.trim().length < 2) {
      errs.name = 'Пожалуйста, укажите ваше имя (минимум 2 символа)';
    }
    const cleanDigits = clientPhone.replace(/\D/g, '');
    if (cleanDigits.length < 9) {
      errs.phone = 'Укажите корректный номер телефона';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    setErrorMessage('');
    if (currentStep === 1) {
      if (!selectedServiceId) {
        setErrorMessage('Выберите услугу для продолжения');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedBarberId) {
        setErrorMessage('Выберите мастера или вариант «Любой свободный»');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selectedDate || !selectedTime) {
        setErrorMessage('Выберите дату и свободное время');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (validateContacts()) {
        handleSubmitBooking();
      }
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    if (currentStep > 1 && !isSubmitting && !isSuccess) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmitBooking = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    // Поиск выбранного слота
    const chosenSlot = realSlots.find((s) => s.time === selectedTime);
    const startsAt = chosenSlot ? chosenSlot.startsAt : `${selectedDate}T${selectedTime}:00.000Z`;

    const res = await createBooking({
      serviceIds: [selectedServiceId],
      barberId: selectedBarberId,
      startsAt,
      client: {
        name: clientName.trim(),
        phone: clientPhone.trim(),
      },
      comment: clientComment.trim() || undefined,
      source: 'web',
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      setCreatedBooking(res.data);
      setIsSuccess(true);
      setCurrentStep(5);
    } else {
      setErrorMessage(res.error?.message || 'Не удалось создать бронирование. Попробуйте еще раз.');
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setIsSuccess(false);
    setSelectedServiceId(editorialServices[0].id);
    setSelectedBarberId('any');
    setSelectedDate(dateOptions[0].dateStr);
    setSelectedTime('12:00');
    setClientName('');
    setClientPhone('+998 ');
    setClientComment('');
    setValidationErrors({});
    setErrorMessage('');
  };

  return (
    <div className={styles.bookingPageWrapper}>
      {/* Top Bar / Navigation */}
      <header className={styles.bookingHeader}>
        <div className={`container ${styles.headerInner}`}>
          <Link href="/" className={styles.backHomeBtn}>
            <ArrowLeft size={16} />
            <span>На главную</span>
          </Link>
          <div className={styles.brandTitle}>
            <span className={styles.brandName}>{brandInfo.name}</span>
            <span className={styles.headerSubtitle}>Онлайн-запись</span>
          </div>
          <div className={styles.supportContact}>
            <span>{brandInfo.phone}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className={`container ${styles.mainContainer}`}>
        {/* Progress Stepper (visible on steps 1-4) */}
        {!isSuccess && (
          <nav className={styles.stepperNav} aria-label="Этапы бронирования">
            <div className={styles.stepperList}>
              {[
                { step: 1, label: 'Услуга' },
                { step: 2, label: 'Мастер' },
                { step: 3, label: 'Дата и время' },
                { step: 4, label: 'Контакты' },
              ].map((item) => {
                const isPassed = currentStep > item.step;
                const isCurrent = currentStep === item.step;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => {
                      if (item.step < currentStep) {
                        setCurrentStep(item.step);
                        setErrorMessage('');
                      }
                    }}
                    disabled={item.step > currentStep}
                    className={`${styles.stepButton} ${isCurrent ? styles.stepCurrent : ''} ${isPassed ? styles.stepPassed : ''}`}
                  >
                    <span className={styles.stepBadge}>
                      {isPassed ? <Check size={13} strokeWidth={3} /> : item.step}
                    </span>
                    <span className={styles.stepText}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className={styles.alertError} role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Two-Column Layout: Form & Live Summary */}
        <div className={styles.layoutGrid}>
          {/* LEFT: Step Form View */}
          <div className={styles.formColumn}>
            {/* STEP 1: УСЛУГА */}
            {currentStep === 1 && (
              <section className={styles.stepSection}>
                <div className={styles.stepHeader}>
                  <div className="editorial-tag">Шаг 1 из 4</div>
                  <h1 className={styles.stepTitle}>Выберите услугу</h1>
                  <p className={styles.stepSubtitle}>
                    В каждую стрижку включены мытье головы, стайлинг и уходовые средства.
                  </p>
                </div>

                <div className={styles.servicesGrid}>
                  {services.map((service) => {
                    const isSelected = service.id === selectedServiceId;
                    return (
                      <div
                        key={service.id}
                        className={`${styles.serviceCard} ${isSelected ? styles.cardActive : ''}`}
                        onClick={() => setSelectedServiceId(service.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedServiceId(service.id)}
                      >
                        <div className={styles.cardHeaderRow}>
                          <span className={styles.serviceIndexTag}>{service.index}</span>
                          <span className={styles.serviceDuration}>
                            <Clock size={13} /> {service.durationMin} мин
                          </span>
                        </div>
                        <h3 className={styles.serviceCardTitle}>{service.name}</h3>
                        <p className={styles.serviceCardDesc}>{service.description}</p>
                        <div className={styles.cardFooterRow}>
                          <div className={styles.servicePrice}>{service.priceFormatted}</div>
                          <div className={`${styles.selectionCheck} ${isSelected ? styles.checkActive : ''}`}>
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* STEP 2: БАРБЕР */}
            {currentStep === 2 && (
              <section className={styles.stepSection}>
                <div className={styles.stepHeader}>
                  <div className="editorial-tag">Шаг 2 из 4</div>
                  <h1 className={styles.stepTitle}>Выберите мастера</h1>
                  <p className={styles.stepSubtitle}>
                    Если у вас нет предпочтений, выберите автоматический подбор — это ускорит запись.
                  </p>
                </div>

                <div className={styles.barbersGrid}>
                  {allBarbers.map((barber) => {
                    const isSelected = barber.id === selectedBarberId;
                    const isAny = barber.id === 'any';

                    return (
                      <div
                        key={barber.id}
                        className={`${styles.barberCard} ${isSelected ? styles.cardActive : ''} ${isAny ? styles.anyBarberCard : ''}`}
                        onClick={() => setSelectedBarberId(barber.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedBarberId(barber.id)}
                      >
                        <div className={styles.barberAvatarWrap}>
                          <img
                            src={barber.photoUrl}
                            alt={barber.name}
                            className={styles.barberPhoto}
                            loading="lazy"
                          />
                          {isAny && (
                            <div className={styles.anyBadge}>
                              <Sparkles size={14} />
                            </div>
                          )}
                        </div>

                        <div className={styles.barberCardInfo}>
                          <div className={styles.barberMetaRow}>
                            <span className={styles.barberRoleTag}>{barber.role}</span>
                            <span className={styles.barberExp}>{barber.experience}</span>
                          </div>
                          <h3 className={styles.barberName}>{barber.name}</h3>
                          <p className={styles.barberQuote}>«{barber.quote}»</p>

                          <div className={styles.barberPills}>
                            {barber.specialties.map((spec) => (
                              <span key={spec} className={styles.barberPill}>
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className={`${styles.selectionCheck} ${isSelected ? styles.checkActive : ''}`}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* STEP 3: ДАТА И ВРЕМЯ */}
            {currentStep === 3 && (
              <section className={styles.stepSection}>
                <div className={styles.stepHeader}>
                  <div className="editorial-tag">Шаг 3 из 4</div>
                  <h1 className={styles.stepTitle}>Дата и свободный слот</h1>
                  <p className={styles.stepSubtitle}>
                    Время работы салона: {brandInfo.hours}, без выходных.
                  </p>
                </div>

                {/* Day selector */}
                <div className={styles.dateSelectorBlock}>
                  <label className={styles.fieldLabel}>Выберите день</label>
                  <div className={styles.datesRow}>
                    {dateOptions.map((item) => {
                      const isSelected = item.dateStr === selectedDate;
                      return (
                        <button
                          key={item.dateStr}
                          type="button"
                          className={`${styles.dateButton} ${isSelected ? styles.dateActive : ''}`}
                          onClick={() => setSelectedDate(item.dateStr)}
                        >
                          <span className={styles.dateDayWeek}>{item.dayOfWeek}</span>
                          <span className={styles.dateDayNum}>{item.dayOfMonth}</span>
                          <span className={styles.dateMonthName}>{item.monthName}</span>
                          {item.isToday && <span className={styles.todayIndicator}>Сегодня</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Grid */}
                <div className={styles.timeSelectorBlock}>
                  <div className={styles.timeLabelRow}>
                    <label className={styles.fieldLabel}>Доступные слоты на выбранную дату</label>
                    <span className={styles.slotsCountBadge}>
                      {loadingSlots ? 'Расчёт...' : `${realSlots.length} слотов доступно`}
                    </span>
                  </div>

                  {loadingSlots ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      Проверяем расписание и свободные окна...
                    </div>
                  ) : realSlots.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      На эту дату все слоты заняты. Пожалуйста, выберите другой день.
                    </div>
                  ) : (
                    <div className={styles.timeGrid}>
                      {realSlots.map((slot) => {
                        const isSelected = slot.time === selectedTime;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            className={`${styles.timeSlotBtn} ${isSelected ? styles.timeActive : ''}`}
                            onClick={() => setSelectedTime(slot.time)}
                          >
                            <Clock size={13} />
                            <span>{slot.time}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <p className={styles.slotNote}>
                    * Шаг записи рассчитан на {currentService.durationMin} минут обслуживания мастера.
                  </p>
                </div>
              </section>
            )}

            {/* STEP 4: КОНТАКТЫ */}
            {currentStep === 4 && (
              <section className={styles.stepSection}>
                <div className={styles.stepHeader}>
                  <div className="editorial-tag">Шаг 4 из 4</div>
                  <h1 className={styles.stepTitle}>Контактные данные</h1>
                  <p className={styles.stepSubtitle}>
                    Мы отправим детали записи по SMS или свяжемся в Telegram за 2 часа до визита.
                  </p>
                </div>

                <div className={styles.contactsForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="client-name" className={styles.fieldLabel}>
                      Ваше имя <span className={styles.reqStar}>*</span>
                    </label>
                    <div className={styles.inputWrap}>
                      <User size={18} className={styles.inputIcon} />
                      <input
                        id="client-name"
                        type="text"
                        placeholder="Например, Александр"
                        value={clientName}
                        onChange={(e) => {
                          setClientName(e.target.value);
                          if (validationErrors.name) {
                            setValidationErrors((prev) => ({ ...prev, name: undefined }));
                          }
                        }}
                        className={`${styles.textInput} ${validationErrors.name ? styles.inputInvalid : ''}`}
                      />
                    </div>
                    {validationErrors.name && (
                      <span className={styles.fieldErrorText}>{validationErrors.name}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="client-phone" className={styles.fieldLabel}>
                      Номер телефона <span className={styles.reqStar}>*</span>
                    </label>
                    <div className={styles.inputWrap}>
                      <Phone size={18} className={styles.inputIcon} />
                      <input
                        id="client-phone"
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        value={clientPhone}
                        onChange={(e) => {
                          setClientPhone(e.target.value);
                          if (validationErrors.phone) {
                            setValidationErrors((prev) => ({ ...prev, phone: undefined }));
                          }
                        }}
                        className={`${styles.textInput} ${validationErrors.phone ? styles.inputInvalid : ''}`}
                      />
                    </div>
                    {validationErrors.phone && (
                      <span className={styles.fieldErrorText}>{validationErrors.phone}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="client-comment" className={styles.fieldLabel}>
                      Пожелания или комментарий (опционально)
                    </label>
                    <textarea
                      id="client-comment"
                      rows={3}
                      placeholder="Особые пожелания по напиткам, музыке или стилю стрижки..."
                      value={clientComment}
                      onChange={(e) => setClientComment(e.target.value)}
                      className={styles.textareaInput}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* STEP 5: ПОДТВЕРЖДЕНИЕ / ЭКРАН УСПЕХА */}
            {currentStep === 5 && isSuccess && (
              <section className={styles.successSection}>
                <div className={styles.successIconWrapper}>
                  <CheckCircle2 size={54} className={styles.successIcon} />
                </div>

                <div className="editorial-tag">Бронирование оформлено</div>
                <h1 className={styles.successTitle}>ЖДЕМ ВАС В REMESLO</h1>
                <p className={styles.successSubtitle}>
                  Запись зарегистрирована в локальной системе. Мы закрепили время в кресле за вами.
                </p>

                <div className={styles.ticketCard}>
                  <div className={styles.ticketTop}>
                    <div>
                      <div className={styles.ticketBrand}>{brandInfo.name} • {brandInfo.city}</div>
                      <div className={styles.ticketAddress}>{brandInfo.district}, {brandInfo.address}</div>
                    </div>
                    <div className={styles.ticketStatusBadge}>Подтверждено</div>
                  </div>

                  <div className={styles.ticketDivider} />

                  <div className={styles.ticketDetailsGrid}>
                    <div className={styles.ticketItem}>
                      <span className={styles.ticketLabel}>Услуга</span>
                      <span className={styles.ticketValue}>{currentService.name}</span>
                    </div>
                    <div className={styles.ticketItem}>
                      <span className={styles.ticketLabel}>Мастер</span>
                      <span className={styles.ticketValue}>{currentBarber.name}</span>
                    </div>
                    <div className={styles.ticketItem}>
                      <span className={styles.ticketLabel}>Дата и время</span>
                      <span className={styles.ticketValue}>
                        {selectedDateObj.dayOfMonth} {selectedDateObj.monthName}, {selectedTime}
                      </span>
                    </div>
                    <div className={styles.ticketItem}>
                      <span className={styles.ticketLabel}>Стоимость</span>
                      <span className={styles.ticketValueHighlight}>{currentService.priceFormatted}</span>
                    </div>
                    <div className={styles.ticketItem}>
                      <span className={styles.ticketLabel}>Гость</span>
                      <span className={styles.ticketValue}>{clientName || 'Гость'}</span>
                    </div>
                    <div className={styles.ticketItem}>
                      <span className={styles.ticketLabel}>Телефон</span>
                      <span className={styles.ticketValue}>{clientPhone}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.successActions}>
                  {createdBooking && (
                    <>
                      <a
                        href={`https://t.me/ChopCraftBot?start=b_${createdBooking.manageToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-cinematic"
                        style={{ padding: '16px 36px', background: 'linear-gradient(135deg, #229ED9, #0088cc)', color: '#fff' }}
                      >
                        ✈️ Получать напоминания в Telegram
                      </a>
                      <Link
                        href={`/booking/${createdBooking.manageToken}`}
                        className="btn-secondary"
                        style={{ padding: '16px 36px' }}
                      >
                        Управление записью (перенос / отмена)
                      </Link>
                    </>
                  )}
                  <Link href="/" className="btn-secondary" style={{ padding: '16px 28px' }}>
                    На главную
                  </Link>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-secondary"
                    style={{ padding: '16px 28px' }}
                  >
                    <RotateCcw size={16} />
                    Новая запись
                  </button>
                </div>
              </section>
            )}

            {/* Bottom Form Navigation (Steps 1-4) */}
            {!isSuccess && (
              <div className={styles.controlsRow}>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft size={16} />
                    Назад
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className={`btn-cinematic ${styles.submitNextBtn}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className={styles.spinnerWrap}>
                      <span className={styles.spinner} />
                      Бронируем...
                    </span>
                  ) : currentStep === 4 ? (
                    <>
                      Подтвердить запись
                      <CheckCircle2 size={17} />
                    </>
                  ) : (
                    <>
                      Продолжить
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Live Summary Sticky Widget (visible during steps 1-4) */}
          {!isSuccess && (
            <aside className={styles.summaryColumn}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  <h3 className={styles.summaryTitle}>Ваша запись</h3>
                  <span className={styles.summaryStepBadge}>Шаг {currentStep}/4</span>
                </div>

                <div className={styles.summaryList}>
                  {/* Service item */}
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryIconWrap}>
                      <Scissors size={15} />
                    </div>
                    <div className={styles.summaryItemText}>
                      <span className={styles.summaryItemLabel}>Услуга</span>
                      <strong className={styles.summaryItemValue}>{currentService.name}</strong>
                      <span className={styles.summaryItemMeta}>
                        {currentService.durationMin} мин • {currentService.priceFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Barber item */}
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryIconWrap}>
                      <User size={15} />
                    </div>
                    <div className={styles.summaryItemText}>
                      <span className={styles.summaryItemLabel}>Барбер</span>
                      <strong className={styles.summaryItemValue}>{currentBarber.name}</strong>
                      <span className={styles.summaryItemMeta}>{currentBarber.role}</span>
                    </div>
                  </div>

                  {/* Date & Time item */}
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryIconWrap}>
                      <CalendarIcon size={15} />
                    </div>
                    <div className={styles.summaryItemText}>
                      <span className={styles.summaryItemLabel}>Дата и время</span>
                      <strong className={styles.summaryItemValue}>
                        {selectedDateObj.dayOfMonth} {selectedDateObj.monthName}, {selectedTime}
                      </strong>
                      <span className={styles.summaryItemMeta}>{brandInfo.city}, {brandInfo.hours}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.summaryDivider} />

                {/* Total and notes */}
                <div className={styles.summaryTotalRow}>
                  <span className={styles.totalLabel}>Итого к оплате на месте:</span>
                  <span className={styles.totalAmount}>{currentService.priceFormatted}</span>
                </div>

                <div className={styles.summaryGuarantee}>
                  <CheckCircle2 size={15} className={styles.guaranteeIcon} />
                  <span>Бесплатная отмена за 2 часа до визита. Оплата картой или наличными в салоне.</span>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
