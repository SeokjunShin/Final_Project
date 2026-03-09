-- 발급 카드에 연결 계좌를 실제로 저장

ALTER TABLE cards
  ADD COLUMN bank_account_id BIGINT UNSIGNED NULL AFTER user_id;

ALTER TABLE cards
  ADD CONSTRAINT fk_cards_bank_account
  FOREIGN KEY (bank_account_id) REFERENCES user_bank_accounts(id) ON DELETE SET NULL;

CREATE INDEX idx_cards_bank_account ON cards(bank_account_id);

UPDATE cards c
JOIN card_applications ca ON ca.issued_card_id = c.id
SET c.bank_account_id = ca.bank_account_id
WHERE ca.bank_account_id IS NOT NULL
  AND c.bank_account_id IS NULL;
