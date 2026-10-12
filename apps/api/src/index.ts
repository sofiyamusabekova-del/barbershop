import dotenv from 'dotenv';
import path from 'path';
import { buildApp } from './app.js';
import { setupBotMenu } from './bot.js';

// Загрузка .env из корня монорепозитория
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config(); // fallback на локальный .env если запущен напрямую

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3011) });
    console.log(`🚀 Fastify REST API успешно запущен на порту ${process.env.PORT ?? 3011}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  try {
    await setupBotMenu();
  } catch (err) {
    app.log.error(err, 'Failed to setup Telegram bot menu');
  }
}

main();
