'use client';

import React from 'react';
import { MapPin, Navigation, Phone, Clock, ArrowUpRight } from 'lucide-react';
import { brandInfo } from '../../data/brandData';
import styles from './Location.module.css';

export const Location: React.FC = () => {
  return (
    <section id="location" className={`section ${styles.locationSection}`}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div>
            <div className="editorial-tag">Локация студии</div>
            <h2 className="editorial-title">Приходи в студию</h2>
          </div>
          <p className="editorial-subtitle">
            Мы находимся на тихой зеленой улице Мирабадского района. Собственная парковка для гостей и удобный заезд со стороны проспекта.
          </p>
        </div>

        <div className={styles.locationLayout}>
          {/* Information Ledger */}
          <div className={styles.infoCard}>
            <div className={styles.infoGroup}>
              <div className={styles.infoLabel}>Город & Координаты</div>
              <div className={styles.infoValue}>{brandInfo.city}</div>
              <div className={styles.infoSub}>{brandInfo.coordinates}</div>
            </div>

            <div className={styles.infoGroup}>
              <div className={styles.infoLabel}>Адрес</div>
              <div className={styles.infoValue}>{brandInfo.district}</div>
              <div className={styles.infoSub}>{brandInfo.address}</div>
            </div>

            <div className={styles.infoGroup}>
              <div className={styles.infoLabel}>Режим работы</div>
              <div className={styles.infoValue}>{brandInfo.hours}</div>
              <div className={styles.infoSub}>{brandInfo.workingDays}</div>
            </div>

            <div className={styles.infoGroup}>
              <div className={styles.infoLabel}>Прямая связь</div>
              <a href={`tel:${brandInfo.phoneClean}`} className={styles.phoneLink}>
                {brandInfo.phone}
              </a>
            </div>

            <div className={styles.actionButtons}>
              <a
                href="https://yandex.com/maps/?text=Tashkent+Taras+Shevchenko+28"
                target="_blank"
                rel="noreferrer"
                className="btn-cinematic"
              >
                <Navigation size={16} />
                Маршрут в Яндекс.Картах
              </a>
              <a
                href={brandInfo.telegram}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                Telegram студии
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>

          {/* Atmospheric Space Photo & Architecture Frame */}
          <div className={styles.spaceFrame}>
            <img
              src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=85"
              alt="Интерьер барбершопа REMESLO в Мирабадском районе Ташкента"
              className={styles.spaceImg}
            />
            <div className={styles.spaceBadge}>
              <MapPin size={14} className={styles.pinIcon} />
              <span>Ташкент, {brandInfo.district}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
