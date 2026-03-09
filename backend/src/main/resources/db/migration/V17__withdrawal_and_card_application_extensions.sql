-- 회원 탈퇴 및 카드 신청 확장

ALTER TABLE users
  ADD COLUMN withdrawn_at DATETIME NULL AFTER last_login_at,
  ADD COLUMN withdrawal_reason VARCHAR(255) NULL AFTER withdrawn_at;

ALTER TABLE users DROP CHECK chk_users_status;
ALTER TABLE users
  ADD CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE','LOCKED','DISABLED','WITHDRAWN'));

ALTER TABLE card_applications
  ADD COLUMN bank_account_id BIGINT UNSIGNED NULL AFTER requested_limit,
  ADD COLUMN privacy_consent_yn TINYINT(1) NOT NULL DEFAULT 0 AFTER bank_account_id,
  ADD COLUMN privacy_consented_at DATETIME NULL AFTER privacy_consent_yn,
  ADD COLUMN privacy_policy_version VARCHAR(30) NULL AFTER privacy_consented_at,
  ADD COLUMN retention_until DATETIME NULL AFTER admin_notes;

ALTER TABLE card_applications
  ADD CONSTRAINT fk_card_app_bank_account FOREIGN KEY (bank_account_id) REFERENCES user_bank_accounts(id) ON DELETE SET NULL;

ALTER TABLE documents
  ADD COLUMN card_application_id BIGINT UNSIGNED NULL AFTER user_id;

ALTER TABLE documents
  ADD CONSTRAINT fk_docs_card_application FOREIGN KEY (card_application_id) REFERENCES card_applications(id) ON DELETE SET NULL;

CREATE INDEX idx_docs_card_application ON documents(card_application_id);
