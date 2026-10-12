-- Enable btree_gist extension for range exclusions
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Add column time_range
DO $$ BEGIN
    ALTER TABLE "bookings" ADD COLUMN "time_range" tstzrange;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update existing rows
UPDATE "bookings"
SET "time_range" = tstzrange(starts_at, ends_at, '[)')
WHERE "time_range" IS NULL;

-- Trigger to automatically maintain time_range on INSERT/UPDATE
CREATE OR REPLACE FUNCTION set_booking_time_range()
RETURNS TRIGGER AS $$
BEGIN
    NEW.time_range := tstzrange(NEW.starts_at, NEW.ends_at, '[)');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_time_range ON "bookings";
CREATE TRIGGER trg_booking_time_range
BEFORE INSERT OR UPDATE ON "bookings"
FOR EACH ROW EXECUTE FUNCTION set_booking_time_range();

-- Add constraint bookings_no_overlap
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
