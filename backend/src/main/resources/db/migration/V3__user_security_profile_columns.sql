-- V3__user_security_profile_columns.sql
-- address 컬럼 추가
ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL AFTER phone;

-- two_factor_enabled 컬럼 추가
ALTER TABLE users ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER status;
