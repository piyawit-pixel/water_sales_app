-- =====================================================================
-- BaanPhuan (บ้านเพื่อน) - Supabase Database Schema
-- Paste this script into the Supabase SQL Editor and click 'Run'.
-- =====================================================================

-- 1. Create table for storing raw JSON state (sync channel)
CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the default state if not exists
INSERT INTO app_state (id, data)
VALUES ('current_state', '{"orders": [], "grabPickups": [], "stock": {}, "users": []}')
ON CONFLICT (id) DO NOTHING;

-- 2. Create structured table for Orders (Human-readable & Queryable)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  date TEXT,
  time TEXT,
  customer_name TEXT,
  delivery_type TEXT,
  grab_driver_name TEXT,
  items JSONB,
  price_details JSONB,
  status TEXT,
  created_time TEXT,
  updated_time TEXT,
  staff_name TEXT,
  remark TEXT,
  payment_method TEXT,
  promotion_detail TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create structured table for Grab Pickups (Human-readable & Queryable)
CREATE TABLE IF NOT EXISTS grab_pickups (
  id TEXT PRIMARY KEY,
  driver_name TEXT,
  timestamp TEXT,
  customer_name TEXT,
  items JSONB,
  order_id TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create structured table for Stock (Human-readable & Queryable)
CREATE TABLE IF NOT EXISTS stock (
  drink_id TEXT PRIMARY KEY,
  quantity INTEGER,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create structured table for Users (Human-readable & Queryable)
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  pin TEXT,
  role TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Disable Row Level Security (RLS) to allow public access via Anon Key
-- Note: If you want to restrict access, keep RLS enabled and create policies.
ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE grab_pickups DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 7. Create trigger function to automatically unpack JSON data into structured tables
CREATE OR REPLACE FUNCTION sync_state_to_tables()
RETURNS TRIGGER AS $$
DECLARE
  orders_json JSONB;
  grab_json JSONB;
  stock_json JSONB;
  users_json JSONB;
  drink_key TEXT;
  drink_val INTEGER;
BEGIN
  -- Extract arrays/objects from payload data
  orders_json := NEW.data->'orders';
  grab_json := NEW.data->'grabPickups';
  stock_json := NEW.data->'stock';
  users_json := NEW.data->'users';

  -- A. Sync Orders
  TRUNCATE TABLE orders;
  IF jsonb_typeof(orders_json) = 'array' THEN
    INSERT INTO orders (
      id, date, time, customer_name, delivery_type, grab_driver_name,
      items, price_details, status, created_time, updated_time, staff_name,
      remark, payment_method, promotion_detail
    )
    SELECT 
      (val->>'id')::text,
      (val->>'date')::text,
      (val->>'time')::text,
      (val->>'customerName')::text,
      (val->>'deliveryType')::text,
      (val->>'grabDriverName')::text,
      (val->'items')::jsonb,
      (val->'priceDetails')::jsonb,
      (val->>'status')::text,
      (val->>'createdTime')::text,
      (val->>'updatedTime')::text,
      (val->>'staffName')::text,
      (val->>'remark')::text,
      (val->>'paymentMethod')::text,
      (val->>'promotionDetail')::text
    FROM jsonb_array_elements(orders_json) as val
    ON CONFLICT (id) DO UPDATE SET
      date = EXCLUDED.date,
      time = EXCLUDED.time,
      customer_name = EXCLUDED.customer_name,
      delivery_type = EXCLUDED.delivery_type,
      grab_driver_name = EXCLUDED.grab_driver_name,
      items = EXCLUDED.items,
      price_details = EXCLUDED.price_details,
      status = EXCLUDED.status,
      created_time = EXCLUDED.created_time,
      updated_time = EXCLUDED.updated_time,
      staff_name = EXCLUDED.staff_name,
      remark = EXCLUDED.remark,
      payment_method = EXCLUDED.payment_method,
      promotion_detail = EXCLUDED.promotion_detail;
  END IF;

  -- B. Sync Grab Pickups
  TRUNCATE TABLE grab_pickups;
  IF jsonb_typeof(grab_json) = 'array' THEN
    INSERT INTO grab_pickups (id, driver_name, timestamp, customer_name, items, order_id)
    SELECT 
      (val->>'id')::text,
      (val->>'driverName')::text,
      (val->>'timestamp')::text,
      (val->>'customerName')::text,
      (val->'items')::jsonb,
      (val->>'orderId')::text
    FROM jsonb_array_elements(grab_json) as val
    ON CONFLICT (id) DO UPDATE SET
      driver_name = EXCLUDED.driver_name,
      timestamp = EXCLUDED.timestamp,
      customer_name = EXCLUDED.customer_name,
      items = EXCLUDED.items,
      order_id = EXCLUDED.order_id;
  END IF;

  -- C. Sync Stock
  TRUNCATE TABLE stock;
  IF jsonb_typeof(stock_json) = 'object' THEN
    FOR drink_key, drink_val IN SELECT * FROM jsonb_each_text(stock_json) LOOP
      INSERT INTO stock (drink_id, quantity)
      VALUES (drink_key, drink_val)
      ON CONFLICT (drink_id) DO UPDATE SET quantity = EXCLUDED.quantity;
    END LOOP;
  END IF;

  -- D. Sync Users
  TRUNCATE TABLE users;
  IF jsonb_typeof(users_json) = 'array' THEN
    INSERT INTO users (username, pin, role)
    SELECT 
      (val->>'username')::text,
      (val->>'pin')::text,
      (val->>'role')::text
    FROM jsonb_array_elements(users_json) as val
    ON CONFLICT (username) DO UPDATE SET
      pin = EXCLUDED.pin,
      role = EXCLUDED.role;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Bind trigger to app_state table
DROP TRIGGER IF EXISTS trigger_sync_state_to_tables ON app_state;
CREATE TRIGGER trigger_sync_state_to_tables
AFTER INSERT OR UPDATE ON app_state
FOR EACH ROW
EXECUTE FUNCTION sync_state_to_tables();

-- 9. Enable Realtime for the app_state table (safeguarded)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE app_state;
    EXCEPTION WHEN OTHERS THEN
      -- Already added or other minor issues, ignore
      NULL;
    END;
  END IF;
END $$;
