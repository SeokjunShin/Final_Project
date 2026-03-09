ALTER TABLE user_bank_accounts
  ADD COLUMN current_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER is_default;

ALTER TABLE bank_account_transactions
  ADD COLUMN balance_after DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER amount;

UPDATE bank_account_transactions
SET balance_after = amount
WHERE balance_after = 0.00
  AND transaction_type = 'DEPOSIT';

UPDATE bank_account_transactions
SET balance_after = 0.00
WHERE balance_after = 0.00
  AND transaction_type = 'WITHDRAWAL';

UPDATE user_bank_accounts uba
LEFT JOIN (
  SELECT
    bank_account_id,
    COALESCE(SUM(CASE
      WHEN transaction_type = 'DEPOSIT' THEN amount
      WHEN transaction_type = 'WITHDRAWAL' THEN -amount
      ELSE 0
    END), 0) AS calculated_balance
  FROM bank_account_transactions
  GROUP BY bank_account_id
) tx ON tx.bank_account_id = uba.id
SET uba.current_balance = COALESCE(tx.calculated_balance, 0.00);
