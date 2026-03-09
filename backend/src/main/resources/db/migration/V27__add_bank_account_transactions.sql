CREATE TABLE IF NOT EXISTS bank_account_transactions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  bank_account_id BIGINT UNSIGNED NOT NULL,
  loan_id BIGINT UNSIGNED NULL,
  transaction_type VARCHAR(20) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_bank_account_transactions_account_time (bank_account_id, created_at),
  KEY idx_bank_account_transactions_loan (loan_id),
  CONSTRAINT chk_bank_account_transactions_type CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAWAL')),
  CONSTRAINT fk_bank_account_transactions_account FOREIGN KEY (bank_account_id) REFERENCES user_bank_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_bank_account_transactions_loan FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL
);
