'use client';

import React from 'react';
import Link from 'next/link';
import { brandInfo } from '../../data/brandData';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        <div className={styles.topRow}>
          <div className={styles.brandBlock}>
            <div className={styles.brandTitle}>
              {brandInfo.name} <span className={styles.brandCity}>/ {brandInfo.city}</span>
            </div>
            <div className={styles.brandCoordinates}>
              {brandInfo.coordinates}
            </div>
            <p className={styles.brandDesc}>
              Мужской салон с характером. Точная геометрия, стерильный инструмент, спокойная атмосфера.
            </p>
          </div>

          <div className={styles.navBlock}>
            <div className={styles.colTitle}>Разделы</div>
            <ul className={styles.linksList}>
              <li><a href="#services">Реестр услуг</a></li>
              <li><a href="#barbers">Мастера</a></li>
              <li><a href="#works">Архив работ</a></li>
              <li><a href="#philosophy">Манифест</a></li>
              <li><a href="#location">Локация</a></li>
            </ul>
          </div>

          <div className={styles.contactsBlock}>
            <div className={styles.colTitle}>Ташкент</div>
            <div className={styles.contactItem}>{brandInfo.district}</div>
            <div className={styles.contactItem}>{brandInfo.address}</div>
            <div className={styles.contactItem}>{brandInfo.hours}</div>
            <a href={`tel:${brandInfo.phoneClean}`} className={styles.phoneLink}>
              {brandInfo.phone}
            </a>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} {brandInfo.name}. Все права защищены.
          </div>
          <div className={styles.rightsNote}>
            Ташкент, Узбекистан • Digital Brand Experience
          </div>
        </div>
      </div>
    </footer>
  );
};
