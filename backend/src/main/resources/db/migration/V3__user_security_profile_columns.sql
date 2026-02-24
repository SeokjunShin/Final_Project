-- V3__user_security_profile_columns.sql
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL AFTER phone,
    ADD COLUMN IF NOT EXISTS two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

CREATE INDEX idx_users_status ON users(status);
