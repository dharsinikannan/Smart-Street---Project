-- Migration: Add owner approval flow
-- Run this against your existing Smart Street database

-- 1. Add new request statuses for owner approval flow
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'OWNER_PENDING';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'OWNER_APPROVED';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'OWNER_REJECTED';

-- 2. Add new notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'NEW_VENDOR_REQUEST';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'NEW_OWNER_SPACE';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'OWNER_SPACE_REQUEST';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'OWNER_APPROVAL_GRANTED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'OWNER_APPROVAL_REJECTED';

-- 3. Add owner-approval tracking columns to space_requests
ALTER TABLE space_requests ADD COLUMN IF NOT EXISTS owner_approved_by UUID REFERENCES users(user_id);
ALTER TABLE space_requests ADD COLUMN IF NOT EXISTS owner_approved_at TIMESTAMPTZ;
