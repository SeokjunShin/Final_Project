-- 회원 상태 체크 제약에 WITHDRAWAL_PENDING 추가

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND constraint_name = 'chk_users_status'
        AND constraint_type = 'CHECK'
    ),
    'ALTER TABLE users DROP CHECK chk_users_status',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE users
  ADD CONSTRAINT chk_users_status
  CHECK (status IN ('ACTIVE','LOCKED','DISABLED','WITHDRAWN','WITHDRAWAL_PENDING'));
