-- Smart Street canonical schema (PostgreSQL + PostGIS) - PIN-BASED ONLY
-- Run this with a superuser that can enable extensions.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Enum types
CREATE TYPE user_role AS ENUM ('VENDOR', 'OWNER', 'ADMIN');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE permit_status AS ENUM ('VALID', 'EXPIRED', 'REVOKED');
CREATE TYPE space_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Core tables
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
  vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  license_number TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS owners (
  owner_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SPACES (OWNER) - PIN + RADIUS ONLY
CREATE TABLE IF NOT EXISTS spaces (
  space_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(owner_id) ON DELETE SET NULL,
  center GEOGRAPHY(POINT, 4326) NOT NULL,
  allowed_radius FLOAT8 NOT NULL,  -- meters
  price_per_radius FLOAT8 NOT NULL DEFAULT 0,
  space_name TEXT NOT NULL,
  address TEXT NOT NULL,
  chitta_number TEXT,
  chitta_name TEXT,
  aadhar_number TEXT,
  aadhar_name TEXT,
  image_1_url TEXT,
  image_2_url TEXT,
  status space_status NOT NULL DEFAULT 'PENDING',
  terms_conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SPACE REQUESTS (VENDOR) - PIN + DIMENSIONS ONLY
CREATE TABLE IF NOT EXISTS space_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(space_id) ON DELETE CASCADE,
  center GEOGRAPHY(POINT, 4326) NOT NULL,
  max_width FLOAT8 NOT NULL,       -- meters
  max_length FLOAT8 NOT NULL,      -- meters
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_price FLOAT8 NOT NULL DEFAULT 0,
  status request_status NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ,
  remarks TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT space_requests_time_window CHECK (start_time < end_time)
);

-- PERMITS
CREATE TABLE IF NOT EXISTS permits (
  permit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES space_requests(request_id) ON DELETE CASCADE,
  qr_payload TEXT NOT NULL,
  status permit_status NOT NULL DEFAULT 'VALID',
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_hash TEXT, -- Blockchain transaction hash
  CONSTRAINT permits_validity CHECK (valid_from < valid_to)
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT
);

-- NOTIFICATIONS
CREATE TYPE notification_type AS ENUM ('REQUEST_APPROVED', 'REQUEST_REJECTED', 'PERMIT_ISSUED', 'PERMIT_REVOKED');
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_request_id UUID REFERENCES space_requests(request_id) ON DELETE CASCADE,
  related_permit_id UUID REFERENCES permits(permit_id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes to support spatial/temporal queries
CREATE INDEX IF NOT EXISTS idx_spaces_center ON spaces USING GIST (center);
CREATE INDEX IF NOT EXISTS idx_space_requests_center ON space_requests USING GIST (center);
CREATE INDEX IF NOT EXISTS idx_space_requests_time ON space_requests (space_id, start_time, end_time, status);
CREATE INDEX IF NOT EXISTS idx_permits_status ON permits (status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_vendor_review UNIQUE (vendor_id, user_id)
);


-- ANALYTICS
CREATE TABLE IF NOT EXISTS vendor_stats (
  stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  profile_views INTEGER NOT NULL DEFAULT 0,
  map_impressions INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT unique_vendor_date_stats UNIQUE (vendor_id, date)
);

CREATE INDEX IF NOT EXISTS idx_vendor_stats_date ON vendor_stats (date);
