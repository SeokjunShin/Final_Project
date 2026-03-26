SET @add_session_id = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'session_id'
        ),
        'SELECT 1',
        'ALTER TABLE refresh_tokens ADD COLUMN session_id VARCHAR(36) NULL AFTER user_id'
    )
);
PREPARE stmt FROM @add_session_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_second_auth_verified = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'second_auth_verified'
        ),
        'SELECT 1',
        'ALTER TABLE refresh_tokens ADD COLUMN second_auth_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER token_hash'
    )
);
PREPARE stmt FROM @add_second_auth_verified;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE refresh_tokens
SET session_id = UUID()
WHERE session_id IS NULL;

SET @modify_session_id = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'session_id'
        ),
        'ALTER TABLE refresh_tokens MODIFY COLUMN session_id VARCHAR(36) NOT NULL',
        'SELECT 1'
    )
);
PREPARE stmt FROM @modify_session_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_refresh_user_session_index = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND index_name = 'idx_refresh_user_session'
        ),
        'SELECT 1',
        'CREATE INDEX idx_refresh_user_session ON refresh_tokens (user_id, session_id)'
    )
);
PREPARE stmt FROM @add_refresh_user_session_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
