CREATE TABLE notification_schedules (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_key            text NOT NULL,
  plant_id            text NOT NULL,
  plant_name          text NOT NULL,
  next_watering_date  date NOT NULL,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(user_key, plant_id)
);

CREATE INDEX idx_next_watering_date ON notification_schedules(next_watering_date);
