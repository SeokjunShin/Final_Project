-- 관리자 비밀번호 변경 화면 진입용 4자리 PIN 컬럼 추가 및 테스트 기본값 세팅

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'admin_password_pin'
);

SET @alter_sql = IF(
    @column_exists = 0,
    'ALTER TABLE users ADD COLUMN admin_password_pin VARCHAR(4) NULL AFTER secondary_password',
    'SELECT 1'
);

PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE users
SET admin_password_pin = '1234'
WHERE admin_password_pin IS NULL
  AND id IN (
    SELECT temp.user_id
    FROM (
      SELECT ur.user_id
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name IN ('MASTER_ADMIN', 'REVIEW_ADMIN', 'OPERATOR')
    ) AS temp
  );
