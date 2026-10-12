'use client';

import React from 'react';
import { Star, Quote, CheckCircle } from 'lucide-react';
import { mockReviews } from '../../data/mockData';
import styles from './Reviews.module.css';

export const Reviews: React.FC = () => {
  return (
    <section id="reviews" className={`section ${styles.reviewsSection}`}>
      <div className="container">
        <div className="section-tag">Отзывы</div>
        <h2 className="section-title">Что говорят клиенты</h2>
        <p className="section-subtitle">
          Реальные оценки клиентов после посещения нашей студии.
        </p>

        <div className={styles.reviewsGrid}>
          {mockReviews.map((rev) => (
            <div key={rev.id} className={`glass-card ${styles.reviewCard}`}>
              <div className={styles.quoteIcon}>
                <Quote size={28} />
              </div>

              <div className={styles.stars}>
                {Array.from({ length: rev.rating }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" className={styles.starIcon} />
                ))}
              </div>

              <p className={styles.comment}>{rev.comment}</p>

              <div className={styles.clientMeta}>
                <div>
                  <div className={styles.clientName}>
                    {rev.clientName}
                    <CheckCircle size={14} className={styles.verifiedIcon} />
                  </div>
                  <div className={styles.serviceTag}>Услуга: {rev.serviceName}</div>
                </div>
                <div className={styles.date}>{rev.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
