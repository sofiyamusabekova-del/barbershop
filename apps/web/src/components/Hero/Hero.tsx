'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDownRight, Compass } from 'lucide-react';
import { brandInfo } from '../../data/brandData';
import styles from './Hero.module.css';

export const Hero: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Physical scroll ratio capped between 0 and 1 for the signature hero expansion
  const progress = Math.min(Math.max(scrollY / 450, 0), 1);

  return (
    <section className={styles.heroWrapper}>
      <div className={`container ${styles.heroContainer}`}>
        {/* Top Metadata Strip */}
        <div className={styles.heroMetaStrip}>
          <div className={styles.metaLocation}>
            <Compass size={14} className={styles.metaIcon} />
            <span>{brandInfo.city} — {brandInfo.coordinates}</span>
          </div>
          <div className={styles.metaAddress}>
            {brandInfo.district}, {brandInfo.address}
          </div>
          <div className={styles.metaTime}>
            Ежедневно {brandInfo.hours}
          </div>
        </div>

        {/* Massive Editorial Headline */}
        <div className={styles.titleBlock}>
          <h1 className={styles.mainTitle}>
            <span className={styles.line}>ТОЧНАЯ ФОРМА.</span>
            <span className={styles.lineSecond}>ЧИСТОЕ РЕМЕСЛО.</span>
          </h1>
        </div>

        {/* Signature Moment: Cinematic Frame with Physical Scroll Expansion */}
        <div
          className={styles.cinematicFrame}
          style={{
            transform: `scale(${1 + progress * 0.04})`,
            filter: `brightness(${1 - progress * 0.15})`,
          }}
        >
          <div className={styles.imageMask}>
            <video
              src="/hero-reel.mp4"
              className={styles.heroVideo}
              autoPlay
              muted
              loop
              playsInline
              poster="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1800&q=85"
            />
            <div className={styles.cinematicOverlay}></div>
          </div>

          <div className={styles.frameBadge}>
            <span className={styles.frameDot}></span>
            <span>Запись открыта на сегодня</span>
          </div>

          <div className={styles.frameCaption}>
            <div className={styles.captionHeader}>ТАШКЕНТСКАЯ ШКОЛА ГРУМИНГА</div>
            <div className={styles.captionSub}>Бритье опасным лезвием и геометрия стрижки без лишнего шума</div>
          </div>
        </div>

        {/* Lower Row: Concept & Direct Action */}
        <div className={styles.heroLowerRow}>
          <div className={styles.manifestoSnippet}>
            Мы открыли REMESLO в Мирабадском районе для мужчин, которым не нужны фальшивые статусы. Ты приходишь, садишься в кресло и получаешь стрижку, которая работает на тебя каждый день.
          </div>

          <div className={styles.heroActions}>
            <a href="#services" className="btn-cinematic">
              Выбрать услугу
              <ArrowDownRight size={18} />
            </a>
            <a href="#works" className="btn-secondary">
              Смотреть работы
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
