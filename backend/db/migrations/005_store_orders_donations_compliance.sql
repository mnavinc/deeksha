-- Migration 005: Store Inventory, Orders, Devotional Donations & Indian Legal Compliance Audit Logs
-- DeekshaOrg Production Schema

DO $$ BEGIN
  CREATE TYPE store_vendor_type AS ENUM ('AMAZON', 'INSTAMART', 'BLINKIT', 'DEEKSHA_POINTS');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Store Inventory & E-Commerce / Instant Commerce Links
CREATE TABLE IF NOT EXISTS store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('buy', 'points', 'donate')),
  price_inr numeric(10,2),
  points_cost integer,
  vendor store_vendor_type NOT NULL DEFAULT 'DEEKSHA_POINTS',
  affiliate_url text,
  image_emoji text NOT NULL DEFAULT '📿',
  description text NOT NULL,
  health_tags text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Devotional Orders & Points Redemptions
CREATE TABLE IF NOT EXISTS store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  product_id uuid REFERENCES store_products(id) ON DELETE SET NULL,
  points_spent integer NOT NULL DEFAULT 0,
  amount_paid_inr numeric(10,2) NOT NULL DEFAULT 0.00,
  razorpay_order_id text,
  razorpay_payment_id text,
  status order_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Devotional Donations Log (Sabarimala Annadhanam, Water, Medical)
CREATE TABLE IF NOT EXISTS devotional_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  cause_id text NOT NULL,
  amount_inr numeric(10,2) NOT NULL,
  donor_name text NOT NULL DEFAULT 'Swami Devotee',
  razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- IT Act 2000 & Digital Personal Data Protection Act 2023 (DPDP) Audit Logs
CREATE TABLE IF NOT EXISTS compliance_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  ip_address text,
  user_agent text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS store_products_vendor_idx ON store_products(vendor);
CREATE INDEX IF NOT EXISTS store_orders_user_idx ON store_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS devotional_donations_user_idx ON devotional_donations(user_id, created_at DESC);
