ALTER TABLE users
    ADD COLUMN withdrawal_requested_at DATETIME NULL AFTER withdrawal_reason,
    ADD COLUMN withdrawal_scheduled_at DATETIME NULL AFTER withdrawal_requested_at;
