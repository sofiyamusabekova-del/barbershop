import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REMESLO | Барбершоп в Ташкенте',
  description: 'Архитектурные мужские стрижки, моделирование бороды и традиционное бритье опасной бритвой. Мирабадский район, Ташкент.',
  keywords: ['барбершоп ташкент', 'мужская стрижка ташкент', 'борода ташкент', 'remeslo barbershop'],
  openGraph: {
    title: 'REMESLO | Барбершоп в Ташкенте',
    description: 'Мужской салон с характером. Точная геометрия, чистая работа. Мирабадский район.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
