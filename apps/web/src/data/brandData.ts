export interface ServiceItem {
  id: string;
  index: string;
  name: string;
  description: string;
  durationMin: number;
  priceUzs: number;
  priceFormatted: string;
  category: 'стрижки' | 'борода' | 'комплекс' | 'уход';
  image: string;
}

export interface BarberItem {
  id: string;
  name: string;
  role: string;
  experience: string;
  quote: string;
  photoUrl: string;
  specialties: string[];
}

export interface WorkItem {
  id: string;
  title: string;
  style: string;
  barber: string;
  imageUrl: string;
  aspect: 'portrait' | 'landscape' | 'square';
}

export const brandInfo = {
  name: 'REMESLO',
  city: 'ТАШКЕНТ',
  coordinates: '41°18′05″N 69°16′42″E',
  district: 'Мирабадский район',
  address: 'ул. Тараса Шевченко, 28',
  phone: '+998 71 200 44 88',
  phoneClean: '+998712004488',
  hours: '10:00 — 22:00',
  workingDays: 'Без выходных',
  telegram: 'https://t.me/remeslo_tashkent',
  instagram: 'https://instagram.com/remeslo.tashkent',
};

export const editorialServices: ServiceItem[] = [
  {
    id: 's1',
    index: '01',
    name: 'Мужская стрижка',
    description: 'Мытье головы с массажем, диагностика формы черепа, стрижка ножницами и машинкой, укладка матовой пастой.',
    durationMin: 50,
    priceUzs: 240000,
    priceFormatted: '240 000 сум',
    category: 'стрижки',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's2',
    index: '02',
    name: 'Стрижка + оформление бороды',
    description: 'Полный комплекс обновления: архитектурная стрижка, распаривание компрессом с эвкалиптом, бритье опасным лезвием и уход.',
    durationMin: 80,
    priceUzs: 380000,
    priceFormatted: '380 000 сум',
    category: 'комплекс',
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's3',
    index: '03',
    name: 'Моделирование бороды',
    description: 'Построение четких контуров под линию челюсти, снятие объема, горячее полотенце и смягчающее аргановое масло.',
    durationMin: 40,
    priceUzs: 180000,
    priceFormatted: '180 000 сум',
    category: 'борода',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's4',
    index: '04',
    name: 'Традиционное влажное бритье',
    description: 'Ритуал королевского бритья: два распаривающих компресса, взбитая пена из барсучьего помазка, холодное закрытие пор.',
    durationMin: 45,
    priceUzs: 220000,
    priceFormatted: '220 000 сум',
    category: 'борода',
    image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's5',
    index: '05',
    name: 'Камуфляж седины',
    description: 'Полуперманентное матирование седины без рыжих полутонов. Естественный холодный оттенок на 3–4 недели.',
    durationMin: 35,
    priceUzs: 190000,
    priceFormatted: '190 000 сум',
    category: 'уход',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=800&q=80',
  },
];

export const barbersList: BarberItem[] = [
  {
    id: 'b1',
    name: 'Джасур Рахимов',
    role: 'Шеф-барбер & Сооснователь',
    experience: '9 лет в ремесле',
    quote: 'Стрижка должна идеально садиться на голову сама, без 20 минут укладки феном каждое утро.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85',
    specialties: ['Precision Scissor Work', 'Архитектура бороды', 'Skin Fade'],
  },
  {
    id: 'b2',
    name: 'Сардор Алимов',
    role: 'Senior Barber',
    experience: '6 лет практики',
    quote: 'Главное — геометрия лица и направление роста волос. Никаких шаблонных лекал.',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=85',
    specialties: ['Textured Crop', 'Low Taper Fade', 'Горячее бритье'],
  },
  {
    id: 'b3',
    name: 'Тимур Мансуров',
    role: 'Мастер формы',
    experience: '5 лет практики',
    quote: 'Мужской стиль не требует излишеств. Только чистая линия и правильный баланс.',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=85',
    specialties: ['Классический пробор', 'Modern Mullet', 'Уход за кожей'],
  },
];

export const portfolioWorks: WorkItem[] = [
  {
    id: 'w1',
    title: 'Textured Crop & Taper',
    style: 'Матовая фактура, чистый висок',
    barber: 'Джасур Рахимов',
    imageUrl: 'https://images.unsplash.com/photo-1517832606589-7629c3395909?auto=format&fit=crop&w=900&q=80',
    aspect: 'portrait',
  },
  {
    id: 'w2',
    title: 'Classic Side Part',
    style: 'Английская классика, натуральный блеск',
    barber: 'Сардор Алимов',
    imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80',
    aspect: 'square',
  },
  {
    id: 'w3',
    title: 'Beard Sculpture & Fade',
    style: 'Четкий контур скулы, плавный переход',
    barber: 'Джасур Рахимов',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',
    aspect: 'portrait',
  },
  {
    id: 'w4',
    title: 'Low Drop Fade',
    style: 'Плавный темный градиент на затылке',
    barber: 'Тимур Мансуров',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
    aspect: 'portrait',
  },
];
