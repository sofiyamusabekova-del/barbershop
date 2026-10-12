'use client';

import React from 'react';
import { portfolioWorks } from '../../data/brandData';
import styles from './Works.module.css';

export const Works: React.FC = () => {
  return (
    <section id="works" className={`section ${styles.worksSection}`}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div>
            <div className="editorial-tag">Архив работ</div>
            <h2 className="editorial-title">Фактура и линии</h2>
          </div>
          <p className="editorial-subtitle">
            Каждая форма создается под индивидуальный рост волос, форму лица и образ жизни. Никаких шаблонных фильтров и искусственного глянца.
          </p>
        </div>

        {/* Cinematic Grid with Varied Ratios */}
        <div className={styles.worksGrid}>
          {portfolioWorks.map((work, index) => (
            <div
              key={work.id}
              className={`${styles.workCard} ${work.aspect === 'square' ? styles.aspectSquare : styles.aspectPortrait}`}
            >
              <div className={styles.imageBox}>
                <img src={work.imageUrl} alt={work.title} className={styles.workImg} />
                <div className={styles.workIndex}>0{index + 1}</div>
              </div>

              <div className={styles.workInfo}>
                <div className={styles.workTitle}>{work.title}</div>
                <div className={styles.workStyle}>{work.style}</div>
                <div className={styles.workBarber}>Мастер: {work.barber}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
