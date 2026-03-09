ALTER TABLE loans
  ADD COLUMN bank_account_id BIGINT UNSIGNED NULL AFTER card_id;

ALTER TABLE loans
  ADD CONSTRAINT fk_loans_bank_account
  FOREIGN KEY (bank_account_id) REFERENCES user_bank_accounts(id) ON DELETE SET NULL;

CREATE INDEX idx_loans_bank_account_status ON loans(bank_account_id, status);

UPDATE loans l
JOIN cards c ON c.id = l.card_id
SET l.bank_account_id = c.bank_account_id
WHERE l.bank_account_id IS NULL
  AND c.bank_account_id IS NOT NULL;
