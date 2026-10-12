import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Начинаем наполнение базы данных (Seed)... ---');

  // 1. Очистка старых данных (в правильном порядке связей)
  await prisma.review.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.client.deleteMany();
  await prisma.break.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.timeOff.deleteMany();
  await prisma.barberService.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.service.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.adminUser.deleteMany();

  // 2. Системные настройки
  console.log('Создание системных настроек...');
  const settingsData = [
    { key: 'timezone', value: 'Asia/Tashkent', description: 'Часовой пояс салона' },
    { key: 'slot_step_min', value: '15', description: 'Шаг сетки слотов в минутах' },
    { key: 'booking_horizon_days', value: '30', description: 'Глубина бронирования в днях' },
    { key: 'min_notice_min', value: '30', description: 'Минимальное время до записи' },
    { key: 'cancel_cutoff_min', value: '120', description: 'Запрет отмены клиентом менее чем за N минут' },
    { key: 'reminder_day_minutes', value: '1440', description: 'Напоминание за 24 часа' },
    { key: 'reminder_short_minutes', value: '120', description: 'Напоминание за 2 часа' },
    { key: 'review_delay_min', value: '60', description: 'Запрос отзыва через N минут после завершения' },
    { key: 'review_public_min_rating', value: '4', description: 'Минимальная оценка для авто-публикации' },
  ];

  for (const s of settingsData) {
    await prisma.setting.create({ data: s });
  }

  // 3. Услуги
  console.log('Создание каталога услуг...');
  const s1 = await prisma.service.create({
    data: {
      name: 'Мужская стрижка',
      description: 'Мытье головы с массажем, диагностика формы черепа, стрижка ножницами и машинкой, укладка матовой пастой.',
      durationMin: 50,
      price: 240000,
      category: 'стрижки',
      sortOrder: 1,
    },
  });

  const s2 = await prisma.service.create({
    data: {
      name: 'Стрижка + оформление бороды',
      description: 'Полный комплекс обновления: архитектурная стрижка, распаривание компрессом с эвкалиптом, бритье опасным лезвием и уход.',
      durationMin: 80,
      price: 380000,
      category: 'комплекс',
      sortOrder: 2,
    },
  });

  const s3 = await prisma.service.create({
    data: {
      name: 'Моделирование бороды',
      description: 'Построение четких контуров под линию челюсти, снятие объема, горячее полотенце и смягчающее аргановое масло.',
      durationMin: 40,
      price: 180000,
      category: 'борода',
      sortOrder: 3,
    },
  });

  const s4 = await prisma.service.create({
    data: {
      name: 'Традиционное влажное бритье',
      description: 'Ритуал королевского бритья: два распаривающих компресса, взбитая пена из барсучьего помазка, холодное закрытие пор.',
      durationMin: 45,
      price: 220000,
      category: 'борода',
      sortOrder: 4,
    },
  });

  const s5 = await prisma.service.create({
    data: {
      name: 'Камуфляж седины',
      description: 'Полуперманентное матирование седины без рыжих полутонов. Естественный холодный оттенок на 3–4 недели.',
      durationMin: 35,
      price: 190000,
      category: 'уход',
      sortOrder: 5,
    },
  });

  // 4. Барберы
  console.log('Создание мастеров...');
  const b1 = await prisma.barber.create({
    data: {
      name: 'Джасур Рахимов',
      role: 'Шеф-барбер & Сооснователь',
      experienceYears: 9,
      bio: 'Стрижка должна идеально садиться на голову сама, без 20 минут укладки феном каждое утро.',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85',
      sortOrder: 1,
    },
  });

  const b2 = await prisma.barber.create({
    data: {
      name: 'Сардор Алимов',
      role: 'Senior Barber',
      experienceYears: 6,
      bio: 'Главное — геометрия лица и направление роста волос. Никаких шаблонных лекал.',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=85',
      sortOrder: 2,
    },
  });

  const b3 = await prisma.barber.create({
    data: {
      name: 'Тимур Мансуров',
      role: 'Мастер формы',
      experienceYears: 5,
      bio: 'Мужской стиль не требует излишеств. Только чистая линия и правильный баланс.',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=85',
      sortOrder: 3,
    },
  });

  const allBarbers = [b1, b2, b3];
  const allServices = [s1, s2, s3, s4, s5];

  // 5. Связи barber_services (каждый мастер умеет делать все услуги)
  console.log('Назначение услуг мастерам...');
  for (const barber of allBarbers) {
    for (const service of allServices) {
      await prisma.barberService.create({
        data: {
          barberId: barber.id,
          serviceId: service.id,
          isEnabled: true,
        },
      });
    }
  }

  // 6. График работы (Working Hours 10:00 - 22:00 на 7 дней в неделю)
  console.log('Создание расписания работы (10:00 - 22:00)...');
  for (const barber of allBarbers) {
    for (let day = 0; day <= 6; day++) {
      await prisma.workingHour.create({
        data: {
          barberId: barber.id,
          weekday: day,
          startTime: '10:00',
          endTime: '22:00',
        },
      });

      // Обеденный перерыв с 14:00 до 15:00
      await prisma.break.create({
        data: {
          barberId: barber.id,
          weekday: day,
          startTime: '13:30',
          endTime: '14:30',
        },
      });
    }
  }

  // 7. Портфолио
  console.log('Добавление фотографий в портфолио...');
  await prisma.portfolioItem.createMany({
    data: [
      {
        barberId: b1.id,
        title: 'Textured Crop & Taper',
        imageUrl: 'https://images.unsplash.com/photo-1517832606589-7629c3395909?auto=format&fit=crop&w=900&q=80',
        sortOrder: 1,
      },
      {
        barberId: b2.id,
        title: 'Classic Side Part',
        imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80',
        sortOrder: 2,
      },
      {
        barberId: b1.id,
        title: 'Beard Sculpture & Fade',
        imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',
        sortOrder: 3,
      },
      {
        barberId: b3.id,
        title: 'Low Drop Fade',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
        sortOrder: 4,
      },
    ],
  });

  // 8. Тестовые клиенты
  console.log('Создание тестовых клиентов...');
  const client1 = await prisma.client.create({
    data: {
      name: 'Алишер Усманов',
      phone: '+998901234567',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Фаррух Закиров',
      phone: '+998939876543',
    },
  });

  // 9. Тестовые бронирования
  console.log('Создание тестовых бронирований...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(tomorrow.getMinutes() + 50);

  const booking1 = await prisma.booking.create({
    data: {
      clientId: client1.id,
      barberId: b1.id,
      startsAt: tomorrow,
      endsAt: tomorrowEnd,
      totalPrice: s1.price,
      totalDurationMin: s1.durationMin,
      status: 'confirmed',
      source: 'web',
      comment: 'Без лишних разговоров, хороший кофе.',
      bookingServices: {
        create: {
          serviceId: s1.id,
          name: s1.name,
          durationMin: s1.durationMin,
          price: s1.price,
        },
      },
    },
  });

  // 10. Тестовый отзыв
  console.log('Создание проверенного отзыва...');
  await prisma.review.create({
    data: {
      bookingId: booking1.id,
      barberId: b1.id,
      clientId: client1.id,
      rating: 5,
      comment: 'Идеальная геометрия и внимание к форме лица. Джасур настоящий профессионал своего дела.',
      isPublic: true,
    },
  });

  // 11. Администратор (хэш для пароля admin123)
  console.log('Создание дефолтного администратора...');
  await prisma.adminUser.create({
    data: {
      login: 'admin',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecr2u/c04PzD0d1b6', // 'admin123'
    },
  });

  console.log('✅ Seed успешно завершен! База данных готова к работе.');
}

main()
  .catch((e) => {
    console.error('Ошибка при выполнении seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
