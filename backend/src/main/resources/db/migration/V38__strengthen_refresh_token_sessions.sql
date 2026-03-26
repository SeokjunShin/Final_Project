ALTER TABLE refresh_tokens
    ADD COLUMN session_started_at DATETIME(6) NULL AFTER expires_at,
    ADD COLUMN absolute_expires_at DATETIME(6) NULL AFTER session_started_at;

UPDATE refresh_tokens
SET session_started_at = COALESCE(created_at, NOW(6)),
    absolute_expires_at = DATE_ADD(COALESCE(created_at, NOW(6)), INTERVAL 30 DAY)
WHERE session_started_at IS NULL
   OR absolute_expires_at IS NULL;

ALTER TABLE refresh_tokens
    MODIFY COLUMN session_started_at DATETIME(6) NOT NULL,
    MODIFY COLUMN absolute_expires_at DATETIME(6) NOT NULL;

CREATE INDEX idx_refresh_tokens_user_session_active
    ON refresh_tokens (user_id, session_id, revoked_at, expires_at, absolute_expires_at);
