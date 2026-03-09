-- V23 이력이 누락되었거나 컬럼이 실제로 반영되지 않은 DB 복구용

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'withdrawal_requested_at'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawal_requested_at DATETIME NULL AFTER withdrawal_reason'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'withdrawal_scheduled_at'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawal_scheduled_at DATETIME NULL AFTER withdrawal_requested_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
