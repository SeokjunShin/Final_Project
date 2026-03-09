-- V17 이력이 찍혀 있지만 실제 컬럼이 누락된 DB 복구용

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'withdrawn_at'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawn_at DATETIME NULL AFTER last_login_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'withdrawal_reason'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawal_reason VARCHAR(255) NULL AFTER withdrawn_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'card_applications' AND column_name = 'bank_account_id'),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN bank_account_id BIGINT UNSIGNED NULL AFTER requested_limit'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'card_applications' AND column_name = 'privacy_consent_yn'),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN privacy_consent_yn TINYINT(1) NOT NULL DEFAULT 0 AFTER bank_account_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'card_applications' AND column_name = 'privacy_consented_at'),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN privacy_consented_at DATETIME NULL AFTER privacy_consent_yn'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'card_applications' AND column_name = 'privacy_policy_version'),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN privacy_policy_version VARCHAR(30) NULL AFTER privacy_consented_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'card_applications' AND column_name = 'retention_until'),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN retention_until DATETIME NULL AFTER admin_notes'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'documents' AND column_name = 'card_application_id'),
    'SELECT 1',
    'ALTER TABLE documents ADD COLUMN card_application_id BIGINT UNSIGNED NULL AFTER user_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
