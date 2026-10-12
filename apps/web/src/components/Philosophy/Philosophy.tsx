'use client';

import React from 'react';
import { brandInfo } from '../../data/brandData';
import styles from './Philosophy.module.css';

export const Philosophy: React.FC = () => {
  return (
    <section id="philosophy" className={`section ${styles.philosophySection}`}>
      <div className="container">
        <div className={styles.philosophyInner}>
          <div className="editorial-tag">Манифест студии</div>

          <h2 className={styles.manifestoHeading}>
            МЫ НЕ ДЕЛАЕМ «МОДНО».<br />
            МЫ ДЕЛАЕМ ТАК, ЧТОБЫ ТЕБЕ ПОДХОДИЛО.
          </h2>

          <div className={styles.manifestoGrid}>
            <div className={styles.manifestoText}>
              <p>
                В Ташкенте десятки мест, где тебе предложат золотой интерьер и стандартный фейд под копирку. Мы открыли REMESLO, чтобы вернуть барберингу его первоначальный смысл — ремесло, точность и персональный подход.
              </p>
              <p>
                Хорошая стрижка не кричит о себе. Она незаметно подчеркивает сильные стороны, держит правильную геометрию неделями и смывается в душе без потери формы.
              </p>
            </div>

            <div className={styles.manifestoHighlights}>
              <div className={styles.highlightItem}>
                <div className={styles.highlightNum}>01</div>
                <div className={styles.highlightTitle}>Анатомический анализ</div>
                <div className={styles.highlightDesc}>Смотрим на форму черепа, вихры и плотность волос до первого касания ножницами.</div>
              </div>

              <div className={styles.highlightItem}>
                <div className={styles.highlightNum}>02</div>
                <div className={styles.highlightTitle}>Стерильность хирургического уровня</div>
                <div className={styles.highlightDesc}>Одноразовые лезвия, ультразвуковая обработка и крафт-пакеты для каждого гостя.</div>
              </div>

              <div className={styles.highlightItem}>
                <div className={styles.highlightNum}>03</div>
                <div className={styles.highlightTitle}>Честный мужской клуб</div>
                <div className={styles.highlightDesc}>Никакой суеты. Качественный эспрессо, прохладный зал и спокойная музыка.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
