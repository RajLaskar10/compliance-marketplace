-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE kyc_status AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'flagged', 'cancelled');
CREATE TYPE flag_resolution AS ENUM ('approved', 'rejected');

-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'buyer',
  kyc_status    kyc_status NOT NULL DEFAULT 'not_submitted',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- KYC records
CREATE TABLE kyc_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name         VARCHAR(255) NOT NULL,
  date_of_birth     DATE NOT NULL,
  document_s3_key   VARCHAR(512) NOT NULL,
  status            kyc_status NOT NULL DEFAULT 'pending',
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    UUID NOT NULL REFERENCES users(id),
  seller_id   UUID NOT NULL REFERENCES users(id),
  product_id  UUID NOT NULL REFERENCES products(id),
  amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  status      transaction_status NOT NULL DEFAULT 'pending',
  buyer_ip    VARCHAR(64),
  seller_ip   VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_buyer_id  ON transactions(buyer_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status    ON transactions(status);

-- Transaction flags
CREATE TABLE transaction_flags (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  flag_rule      VARCHAR(64) NOT NULL,
  flagged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by    UUID REFERENCES users(id),
  resolution     flag_resolution,
  resolved_at    TIMESTAMPTZ
);

CREATE INDEX idx_transaction_flags_txn_id ON transaction_flags(transaction_id);

-- Audit logs (append-only — no UPDATE/DELETE routes exist for this table)
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(128) NOT NULL,
  target_id   UUID,
  target_type VARCHAR(64),
  metadata    JSONB,
  ip_address  VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id    ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
