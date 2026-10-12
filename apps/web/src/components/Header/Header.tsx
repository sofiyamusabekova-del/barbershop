'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { brandInfo } from '../../data/brandData';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
      <div className={`container ${styles.headerInner}`}>
        <div className={styles.brandWrapper}>
          <Link href="/" className={styles.logoLink} aria-label="REMESLO главная">
            <span className={styles.logoName}>{brandInfo.name}</span>
            <span className={styles.logoCity}>{brandInfo.city}</span>
          </Link>
          <div className={styles.coordinatesTag}>
            {brandInfo.coordinates}
          </div>
        </div>

        <nav className={`${styles.nav} ${menuOpen ? styles.navActive : ''}`}>
          <a href="#services" className={styles.navLink} onClick={() => setMenuOpen(false)}>
            Услуги
          </a>
          <a href="#barbers" className={styles.navLink} onClick={() => setMenuOpen(false)}>
            Барберы
          </a>
          <a href="#works" className={styles.navLink} onClick={() => setMenuOpen(false)}>
            Работы
          </a>
          <a href="#philosophy" className={styles.navLink} onClick={() => setMenuOpen(false)}>
            О нас
          </a>
          <a href="#location" className={styles.navLink} onClick={() => setMenuOpen(false)}>
            Локация
          </a>

          <div className={styles.mobileDrawerFooter}>
            <div className={styles.mobileAddress}>
              {brandInfo.district}, {brandInfo.address}
            </div>
            <a href={`tel:${brandInfo.phoneClean}`} className={styles.mobilePhone}>
              {brandInfo.phone}
            </a>
            <Link href="/book" className="btn-cinematic" onClick={() => setMenuOpen(false)}>
              Записаться в кресло
            </Link>
          </div>
        </nav>

        <div className={styles.headerRight}>
          <a href={`tel:${brandInfo.phoneClean}`} className={styles.desktopPhone}>
            {brandInfo.phone}
          </a>
          <Link href="/book" className={`btn-cinematic ${styles.ctaButton}`}>
            Записаться
            <ArrowUpRight size={16} />
          </Link>
          <button
            className={styles.burgerBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};
