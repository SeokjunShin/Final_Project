SET @add_failed_login_attempts = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'users'
              AND column_name = 'failed_login_attempts'
        ),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0 AFTER status'
    )
);
PREPARE stmt FROM @add_failed_login_attempts;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_lock_expiry_time = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'users'
              AND column_name = 'lock_expiry_time'
        ),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN lock_expiry_time DATETIME(6) NULL AFTER failed_login_attempts'
    )
);
PREPARE stmt FROM @add_lock_expiry_time;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE users
SET failed_login_attempts = COALESCE(failed_login_attempts, 0)
WHERE failed_login_attempts IS NULL;
