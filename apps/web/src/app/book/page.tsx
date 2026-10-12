import { Metadata } from 'next';
import { BookClient } from './BookClient';
import { brandInfo } from '../../data/brandData';

export const metadata: Metadata = {
  title: `Онлайн-запись | ${brandInfo.name} ${brandInfo.city}`,
  description: `Забронируйте удобное время к барберу в мужской салон ${brandInfo.name}. Выбор услуг, мастеров и удобного слота онлайн.`,
};

export default function BookPage() {
  return <BookClient />;
}
