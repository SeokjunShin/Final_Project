-- Add last_failed_login_at column for time-based brute-force detection
ALTER TABLE users ADD COLUMN last_failed_login_at TIMESTAMP NULL;
