-- Migration: 01_init_barbershop_schema
-- Enable PostgreSQL extensions for GiST exclusion and UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ENUMS
DO $$ BEGIN
    CREATE TYPE "BookingStatus" AS ENUM ('confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BookingSource" AS ENUM ('web', 'telegram', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. services
CREATE TABLE IF NOT EXISTS "services" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'стрижки',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. barbers
CREATE TABLE IF NOT EXISTS "barbers" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Barber',
    "photo_url" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "experience_years" INTEGER NOT NULL,
    "telegram_chat_id" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. portfolio_items
CREATE TABLE IF NOT EXISTS "portfolio_items" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "barber_id" TEXT NOT NULL REFERENCES "barbers"("id") ON DELETE CASCADE,
    "image_url" TEXT NOT NULL,
    "title" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. barber_services
CREATE TABLE IF NOT EXISTS "barber_services" (
    "barber_id" TEXT NOT NULL REFERENCES "barbers"("id") ON DELETE CASCADE,
    "service_id" TEXT NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
    "duration_min" INTEGER,
    "price" INTEGER,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY ("barber_id", "service_id")
);

-- 5. working_hours
CREATE TABLE IF NOT EXISTS "working_hours" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "barber_id" TEXT NOT NULL REFERENCES "barbers"("id") ON DELETE CASCADE,
    "weekday" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    CONSTRAINT "working_hours_barber_weekday_unique" UNIQUE ("barber_id", "weekday")
);

-- 6. breaks
CREATE TABLE IF NOT EXISTS "breaks" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "barber_id" TEXT NOT NULL REFERENCES "barbers"("id") ON DELETE CASCADE,
    "weekday" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL
);

-- 7. time_off
CREATE TABLE IF NOT EXISTS "time_off" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "barber_id" TEXT REFERENCES "barbers"("id") ON DELETE CASCADE,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'day_off',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. clients
CREATE TABLE IF NOT EXISTS "clients" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL UNIQUE,
    "telegram_id" BIGINT UNIQUE,
    "telegram_chat_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. bookings + EXCLUSION CONSTRAINT (no double bookings)
CREATE TABLE IF NOT EXISTS "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "client_id" TEXT NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
    "barber_id" TEXT NOT NULL REFERENCES "barbers"("id") ON DELETE CASCADE,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "total_price" INTEGER NOT NULL,
    "total_duration_min" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'confirmed',
    "source" "BookingSource" NOT NULL DEFAULT 'web',
    "manage_token" TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reminder_day_sent_at" TIMESTAMP(3),
    "reminder_30m_sent_at" TIMESTAMP(3),
    "review_requested_at" TIMESTAMP(3),
    "auto_completed_at" TIMESTAMP(3),
    "time_range" tstzrange GENERATED ALWAYS AS (tstzrange(starts_at, ends_at, '[)')) STORED
);

-- Защита от двойной записи (GIST EXCLUDE)
DO $$ BEGIN
    ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_no_overlap"
    EXCLUDE USING gist (
      barber_id WITH =,
      time_range WITH &&
    )
    WHERE (status = 'confirmed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_bookings_barber_starts" ON "bookings"("barber_id", "starts_at");
CREATE INDEX IF NOT EXISTS "idx_bookings_status_starts" ON "bookings"("status", "starts_at");

-- 10. booking_services
CREATE TABLE IF NOT EXISTS "booking_services" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "booking_id" TEXT NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
    "service_id" TEXT NOT NULL REFERENCES "services"("id") ON DELETE RESTRICT,
    "name" TEXT NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "price" INTEGER NOT NULL
);

-- 11. reviews
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "booking_id" TEXT NOT NULL UNIQUE REFERENCES "bookings"("id") ON DELETE CASCADE,
    "barber_id" TEXT NOT NULL REFERENCES "barbers"("id") ON DELETE CASCADE,
    "client_id" TEXT NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. settings
CREATE TABLE IF NOT EXISTS "settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. admin_users
CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "login" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "telegram_chat_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
