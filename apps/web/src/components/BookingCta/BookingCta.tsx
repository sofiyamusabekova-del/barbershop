'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Phone, Send } from 'lucide-react';
import { brandInfo } from '../../data/brandData';
import styles from './BookingCta.module.css';

export const BookingCta: React.FC = () => {
  return (
    <section id="booking-cta" className={`section ${styles.ctaSection}`}>
      <div className="container">
        <div className={styles.ctaCard}>
          <div className={styles.ctaContent}>
            <div className="editorial-tag">Бронирование времени</div>

            <h2 className={styles.ctaHeading}>
              ГОТОВ?<br />
              САДИСЬ В КРЕСЛО.
            </h2>

            <p className={styles.ctaDescription}>
              Запись занимает 2 минуты. Выбери услугу, своего мастера и удобное время в Мирабадском районе Ташкента.
            </p>

            <div className={styles.ctaActions}>
              <Link href="/book" className="btn-cinematic" style={{ padding: '18px 42px', fontSize: '15px' }}>
                Записаться сейчас
                <ArrowUpRight size={18} />
              </Link>

              <a
                href={brandInfo.telegram}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ padding: '18px 36px', fontSize: '15px' }}
              >
                <Send size={16} />
                Написать в Telegram
              </a>

              <a
                href={`tel:${brandInfo.phoneClean}`}
                className="btn-secondary"
                style={{ padding: '18px 36px', fontSize: '15px' }}
              >
                <Phone size={16} />
                Позвонить
              </a>
            </div>

            <div className={styles.ctaMeta}>
              <span>{brandInfo.city}</span>
              <span>•</span>
              <span>{brandInfo.address}</span>
              <span>•</span>
              <span>{brandInfo.hours}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
