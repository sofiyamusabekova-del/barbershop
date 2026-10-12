'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowUpRight } from 'lucide-react';
import { editorialServices, ServiceItem } from '../../data/brandData';
import { fetchServices, ApiService } from '../../lib/api';
import styles from './Services.module.css';

export const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>(editorialServices);
  const [activeService, setActiveService] = useState<ServiceItem>(editorialServices[0]);

  useEffect(() => {
    // Подгрузка реальных услуг из Fastify REST API
    async function loadApiServices() {
      const data = await fetchServices();
      if (data && data.length > 0) {
        const mapped: ServiceItem[] = data.map((item, index) => {
          const fallback = editorialServices[index] || editorialServices[0];
          return {
            id: item.id,
            index: String(index + 1).padStart(2, '0'),
            name: item.name,
            description: item.description,
            durationMin: item.durationMin,
            priceUzs: item.price,
            priceFormatted: `${item.price.toLocaleString('ru-RU')} сум`,
            category: (item.category as any) || fallback.category,
            image: fallback.image,
          };
        });
        setServices(mapped);
        setActiveService(mapped[0]);
      }
    }

    loadApiServices();
  }, []);

  return (
    <section id="services" className={`section ${styles.servicesSection}`}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div>
            <div className="editorial-tag">Реестр услуг</div>
            <h2 className="editorial-title">Ремесло и сервис</h2>
          </div>
          <p className="editorial-subtitle">
            Каждая позиция включает мытье головы с натуральными шампунями, моделирование формы под анатомию черепа и рекомендации по уходу.
          </p>
        </div>

        {/* Editorial Split Ledger */}
        <div className={styles.ledgerLayout}>
          {/* Interactive Rows */}
          <div className={styles.servicesList}>
            {services.map((service) => {
              const isSelected = activeService.id === service.id;
              return (
                <div
                  key={service.id}
                  className={`${styles.serviceRow} ${isSelected ? styles.serviceRowActive : ''}`}
                  onMouseEnter={() => setActiveService(service)}
                  onClick={() => setActiveService(service)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveService(service);
                    }
                  }}
                  aria-label={`${service.name}, цена ${service.priceFormatted}`}
                >
                  <div className={styles.rowLeft}>
                    <span className={styles.rowIndex}>{service.index}</span>
                    <div>
                      <h3 className={styles.rowName}>{service.name}</h3>
                      <p className={styles.rowDesc}>{service.description}</p>
                    </div>
                  </div>

                  <div className={styles.rowRight}>
                    <div className={styles.rowTime}>
                      <Clock size={13} />
                      <span>{service.durationMin} мин</span>
                    </div>
                    <div className={styles.rowPrice}>{service.priceFormatted}</div>
                    <Link href="/book" className={styles.bookInlineBtn} aria-label={`Записаться на ${service.name}`}>
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Visual Preview for Active Item */}
          <div className={styles.previewPanel}>
            <div className={styles.previewCard}>
              <div className={styles.previewImageWrapper}>
                <img
                  src={activeService.image}
                  alt={activeService.name}
                  className={styles.previewImage}
                />
              </div>
              <div className={styles.previewMeta}>
                <span className={styles.previewCategory}>Позиция {activeService.index}</span>
                <h4 className={styles.previewTitle}>{activeService.name}</h4>
                <div className={styles.previewPrice}>{activeService.priceFormatted}</div>
                <Link href="/book" className="btn-cinematic" style={{ width: '100%', marginTop: '16px' }}>
                  Выбрать в запись
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
