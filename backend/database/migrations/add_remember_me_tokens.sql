-- Migration: Add remember_me_tokens table
-- Run: psql -d <your_db> -f add_remember_me_tokens.sql

CREATE TABLE IF NOT EXISTS remember_me_tokens (
  token_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,   -- SHA-256 hash of the raw token
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remember_me_token_hash ON remember_me_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_remember_me_user       ON remember_me_tokens (user_id);
