SET @add_session_started_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'session_started_at'
        ),
        'SELECT 1',
        'ALTER TABLE refresh_tokens ADD COLUMN session_started_at DATETIME(6) NULL AFTER expires_at'
    )
);
PREPARE stmt FROM @add_session_started_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_absolute_expires_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'absolute_expires_at'
        ),
        'SELECT 1',
        'ALTER TABLE refresh_tokens ADD COLUMN absolute_expires_at DATETIME(6) NULL AFTER session_started_at'
    )
);
PREPARE stmt FROM @add_absolute_expires_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE refresh_tokens
SET session_started_at = COALESCE(created_at, NOW(6)),
    absolute_expires_at = DATE_ADD(COALESCE(created_at, NOW(6)), INTERVAL 30 DAY)
WHERE session_started_at IS NULL
   OR absolute_expires_at IS NULL;

SET @modify_session_started_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'session_started_at'
              AND is_nullable = 'YES'
        ),
        'ALTER TABLE refresh_tokens MODIFY COLUMN session_started_at DATETIME(6) NOT NULL',
        'SELECT 1'
    )
);
PREPARE stmt FROM @modify_session_started_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @modify_absolute_expires_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'absolute_expires_at'
              AND is_nullable = 'YES'
        ),
        'ALTER TABLE refresh_tokens MODIFY COLUMN absolute_expires_at DATETIME(6) NOT NULL',
        'SELECT 1'
    )
);
PREPARE stmt FROM @modify_absolute_expires_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_index_refresh_tokens_active = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND index_name = 'idx_refresh_tokens_user_session_active'
        ),
        'SELECT 1',
        'CREATE INDEX idx_refresh_tokens_user_session_active ON refresh_tokens (user_id, session_id, revoked_at, expires_at, absolute_expires_at)'
    )
);
PREPARE stmt FROM @add_index_refresh_tokens_active;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
