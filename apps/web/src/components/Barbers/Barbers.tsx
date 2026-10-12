'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { barbersList, BarberItem } from '../../data/brandData';
import { fetchBarbers, ApiBarber } from '../../lib/api';
import styles from './Barbers.module.css';

export const Barbers: React.FC = () => {
  const [barbers, setBarbers] = useState<BarberItem[]>(barbersList);

  useEffect(() => {
    async function loadApiBarbers() {
      const data = await fetchBarbers();
      if (data && data.length > 0) {
        const mapped: BarberItem[] = data.map((b, index) => {
          const fallback = barbersList[index] || barbersList[0];
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
        setBarbers(mapped);
      }
    }

    loadApiBarbers();
  }, []);

  const leadBarber = barbers[0] || barbersList[0];
  const teamBarbers = barbers.slice(1);

  return (
    <section id="barbers" className={`section ${styles.barbersSection}`}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div>
            <div className="editorial-tag">Команда мастеров</div>
            <h2 className="editorial-title">Люди ремесла</h2>
          </div>
          <p className="editorial-subtitle">
            Мы не набираем «универсалов». Каждый барбер в студии специализируется на сложной архитектуре стрижки и владеет филигранной техникой бритья.
          </p>
        </div>

        {/* Asymmetrical Editorial Composition */}
        <div className={styles.barbersLayout}>
          {/* Main Large Portrait (Lead Barber) */}
          <div className={styles.leadCard}>
            <div className={styles.leadImageWrapper}>
              <img
                src={leadBarber.photoUrl}
                alt={leadBarber.name}
                className={styles.leadImage}
              />
              <div className={styles.leadBadge}>Шеф-барбер</div>
            </div>

            <div className={styles.leadContent}>
              <div className={styles.barberExp}>{leadBarber.experience}</div>
              <h3 className={styles.leadName}>{leadBarber.name}</h3>
              <p className={styles.leadQuote}>«{leadBarber.quote}»</p>

              <div className={styles.specialtiesList}>
                {leadBarber.specialties.map((spec, i) => (
                  <span key={i} className={styles.specTag}>{spec}</span>
                ))}
              </div>

              <Link href="/book" className="btn-cinematic" style={{ marginTop: '24px' }}>
                Записаться к {leadBarber.name.split(' ')[0]}
              </Link>
            </div>
          </div>

          {/* Secondary Stacked Portraits */}
          <div className={styles.teamStack}>
            {teamBarbers.map((barber) => (
              <div key={barber.id} className={styles.teamCard}>
                <div className={styles.teamImgWrapper}>
                  <img
                    src={barber.photoUrl}
                    alt={barber.name}
                    className={styles.teamImg}
                  />
                </div>

                <div className={styles.teamContent}>
                  <div className={styles.barberExp}>{barber.experience}</div>
                  <h4 className={styles.teamName}>{barber.name}</h4>
                  <p className={styles.teamRole}>{barber.role}</p>

                  <div className={styles.teamSpecs}>
                    {barber.specialties.slice(0, 2).map((spec, i) => (
                      <span key={i} className={styles.specTagSmall}>{spec}</span>
                    ))}
                  </div>

                  <Link href="/book" className={styles.teamBookLink}>
                    Выбрать в кресло →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
