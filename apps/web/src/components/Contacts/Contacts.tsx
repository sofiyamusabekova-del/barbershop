'use client';

import React from 'react';
import { MapPin, Phone, Clock, Send, Navigation } from 'lucide-react';
import { contactsData } from '../../data/mockData';
import styles from './Contacts.module.css';

export const Contacts: React.FC = () => {
  return (
    <section id="contacts" className={`section ${styles.contactsSection}`}>
      <div className="container">
        <div className="section-tag">Контакты</div>
        <h2 className="section-title">Адрес и часы работы</h2>
        <p className="section-subtitle">
          Находимся в 3 минутах от метро. Гостевая парковка и зона отдыха для всех клиентов.
        </p>

        <div className={styles.contactsGrid}>
          <div className={`glass-card ${styles.infoCard}`}>
            <h3 className={styles.infoTitle}>Контакты</h3>

            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <div className={styles.iconBox}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div className={styles.itemLabel}>Адрес</div>
                  <div className={styles.itemValue}>{contactsData.address}</div>
                  <div className={styles.itemSub}>{contactsData.metro}</div>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.iconBox}>
                  <Clock size={20} />
                </div>
                <div>
                  <div className={styles.itemLabel}>Время работы</div>
                  <div className={styles.itemValue}>{contactsData.workingHours}</div>
                  <div className={styles.itemSub}>Без выходных и перерывов</div>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.iconBox}>
                  <Phone size={20} />
                </div>
                <div>
                  <div className={styles.itemLabel}>Телефон</div>
                  <a href={`tel:${contactsData.phone}`} className={styles.itemLink}>
                    {contactsData.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.socials}>
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className={`btn btn-outline ${styles.socialBtn}`}
              >
                <Send size={16} />
                Telegram Bot
              </a>
              <a
                href="https://yandex.ru/maps"
                target="_blank"
                rel="noreferrer"
                className={`btn btn-outline ${styles.socialBtn}`}
              >
                <Navigation size={16} />
                Маршрут в Яндекс.Картах
              </a>
            </div>
          </div>

          <div className={styles.mapContainer}>
            <div className={styles.mapFrameWrapper}>
              <iframe
                title="Yandex Map Location"
                src="https://yandex.ru/map-widget/v1/?ll=37.616335%2C55.761895&z=16&pt=37.616335,55.761895,pm2rdm"
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen={true}
                className={styles.mapFrame}
              ></iframe>
            </div>
            <div className={styles.mapOverlayHint}>
              <Navigation size={16} className={styles.navPin} />
              <span>г. Москва, ул. Большая Дмитровка, д. 14, стр. 1</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
