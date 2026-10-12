import { Metadata } from 'next';
import { BookingTokenClient } from './BookingTokenClient';
import { brandInfo } from '../../../data/brandData';

interface BookingPageProps {
  params: Promise<{
    token: string;
  }>;
}

export const metadata: Metadata = {
  title: `Управление бронированием | ${brandInfo.name}`,
  description: 'Просмотр, перенос или отмена визита в барбершоп.',
};

export default async function BookingPage({ params }: BookingPageProps) {
  const { token } = await params;
  return <BookingTokenClient token={token} />;
}
