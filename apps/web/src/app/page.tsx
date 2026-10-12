import React from 'react';
import { Header } from '../components/Header/Header';
import { Hero } from '../components/Hero/Hero';
import { Services } from '../components/Services/Services';
import { Barbers } from '../components/Barbers/Barbers';
import { Works } from '../components/Works/Works';
import { Philosophy } from '../components/Philosophy/Philosophy';
import { Location } from '../components/Location/Location';
import { BookingCta } from '../components/BookingCta/BookingCta';
import { Footer } from '../components/Footer/Footer';

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <Services />
      <Barbers />
      <Works />
      <Philosophy />
      <Location />
      <BookingCta />
      <Footer />
    </main>
  );
}
