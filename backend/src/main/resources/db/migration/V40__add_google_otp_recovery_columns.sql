SET @add_otp_secret = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'users'
              AND column_name = 'otp_secret'
        ),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN otp_secret VARCHAR(64) NULL AFTER security_answer'
    )
);
PREPARE stmt FROM @add_otp_secret;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_otp_enabled = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'users'
              AND column_name = 'otp_enabled'
        ),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN otp_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER otp_secret'
    )
);
PREPARE stmt FROM @add_otp_enabled;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
