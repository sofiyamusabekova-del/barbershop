-- ==============================================================================
-- НАСТРОЙКА SUPABASE CRON ДЛЯ ФОНОВЫХ УВЕДОМЛЕНИЙ (Каждые 5 минут)
-- ==============================================================================

-- 1. Включаем расширения pg_cron и pg_net (если еще не включены)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Регистрируем периодический вызов Edge Function notifications каждые 5 минут
-- Замените [YOUR-PROJECT-REF] и [YOUR-ANON-KEY] на реальные значения проекта Supabase
SELECT cron.schedule(
  'process-barbershop-reminders',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://[YOUR-PROJECT-REF].supabase.co/functions/v1/notifications',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer [YOUR-ANON-KEY]'
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Просмотр зарегистрированных cron задач:
-- SELECT * FROM cron.job;

-- Просмотр истории выполнения cron задач:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
