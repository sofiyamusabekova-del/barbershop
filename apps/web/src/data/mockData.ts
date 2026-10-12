export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  priceRub: number;
  category: 'стрижки' | 'борода' | 'комплексы' | 'уход';
  popular?: boolean;
}

export interface BarberItem {
  id: string;
  name: string;
  role: string;
  experience: string;
  rating: number;
  reviewsCount: number;
  photoUrl: string;
  bio: string;
  specialties: string[];
}

export interface ReviewItem {
  id: string;
  clientName: string;
  barberName: string;
  rating: number;
  date: string;
  comment: string;
  serviceName: string;
}

export const mockServices: ServiceItem[] = [
  {
    id: 's1',
    name: 'Мужская стрижка',
    description: 'Мытье головы, подбор формы, стрижка ножницами и машинкой, укладка профессиональной косметикой.',
    durationMin: 50,
    priceRub: 1800,
    category: 'стрижки',
    popular: true,
  },
  {
    id: 's2',
    name: 'Моделирование бороды',
    description: 'Четкие контуры опасной бритвой или шейвером, распаривание горячим полотенцем, уход с бальзамом.',
    durationMin: 40,
    priceRub: 1200,
    category: 'борода',
    popular: true,
  },
  {
    id: 's3',
    name: 'Комплекс «Стрижка + Борода»',
    description: 'Фирменная мужская стрижка и полное оформление бороды. Выгода и безупречный стиль.',
    durationMin: 80,
    priceRub: 2700,
    category: 'комплексы',
    popular: true,
  },
  {
    id: 's4',
    name: 'Детская стрижка (до 12 лет)',
    description: 'Бережная стрижка юных джентльменов в спокойной и дружеской атмосфере.',
    durationMin: 45,
    priceRub: 1400,
    category: 'стрижки',
  },
  {
    id: 's5',
    name: 'Традиционное бритье опасной бритвой',
    description: 'Королевское бритье с распариванием горячими эфирными полотенцами и холодным компрессом.',
    durationMin: 45,
    priceRub: 1600,
    category: 'борода',
  },
  {
    id: 's6',
    name: 'Камуфляж седины бороды и волос',
    description: 'Мягкое тонирование седины естественным оттенком без эффекта парика.',
    durationMin: 35,
    priceRub: 1300,
    category: 'уход',
  },
];

export const mockBarbers: BarberItem[] = [
  {
    id: 'b1',
    name: 'Александр Громов',
    role: 'Top Barber & Основатель',
    experience: '8 лет опыта',
    rating: 4.98,
    reviewsCount: 312,
    photoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=80',
    bio: 'Мастер классических английских техник и идеальных фейдов. Обучался в лучших академиях Лондона.',
    specialties: ['Fade', 'Классика', 'Королевское бритье'],
  },
  {
    id: 'b2',
    name: 'Максим Воронов',
    role: 'Senior Barber',
    experience: '6 лет опыта',
    rating: 4.94,
    reviewsCount: 248,
    photoUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=700&q=80',
    bio: 'Эксперт по сложным бородам и текстурным стрижкам. Подберет форму, подчеркивающую ваш характер.',
    specialties: ['Дизайн бороды', 'Crop', 'Текстурные укладки'],
  },
  {
    id: 'b3',
    name: 'Даниил Северный',
    role: 'Barber & Стилист',
    experience: '4 года опыта',
    rating: 4.91,
    reviewsCount: 165,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80',
    bio: 'Свежий взгляд на современный мужской стиль. Внимателен к мелочам, идеально слышит пожелания клиента.',
    specialties: ['Modern Mullet', 'Удлиненные стрижки', 'Камуфляж'],
  },
];

export const mockReviews: ReviewItem[] = [
  {
    id: 'r1',
    clientName: 'Михаил Резников',
    barberName: 'Александр Громов',
    rating: 5,
    date: '2 дня назад',
    comment: 'Лучший барбершоп в городе! Атмосфера настоящего мужского клуба, кофе отменный, стрижка выполнена с ювелирной точностью. Хожу уже второй год.',
    serviceName: 'Комплекс «Стрижка + Борода»',
  },
  {
    id: 'r2',
    clientName: 'Артем Васильев',
    barberName: 'Максим Воронов',
    rating: 5,
    date: 'Неделю назад',
    comment: 'Максим идеально оформил бороду. Линии ровные, подобрал масло под мой тип кожи. Сервис на 10 из 10.',
    serviceName: 'Моделирование бороды',
  },
  {
    id: 'r3',
    clientName: 'Игорь Смирнов',
    barberName: 'Даниил Северный',
    rating: 5,
    date: '2 недели назад',
    comment: 'Привел сына и сам подстригся. Даниил нашел отличный контакт с ребенком, оба ушли довольные. Спасибо команде!',
    serviceName: 'Мужская стрижка',
  },
];

export const contactsData = {
  address: 'г. Москва, ул. Большая Дмитровка, д. 14, стр. 1',
  metro: 'Театральная / Чеховская (3 мин пешком)',
  phone: '+7 (495) 890-44-22',
  workingHours: 'Ежедневно с 10:00 до 22:00',
  instagram: '@barbershop_prime',
  telegram: '@prime_barber_bot',
};
