-- 계좌 삭제로 결제계좌 연결이 끊어진 카드/신청 건 복구

UPDATE cards c
JOIN (
  SELECT
    user_id,
    COALESCE(MAX(CASE WHEN is_default = 1 THEN id END), MIN(id)) AS replacement_account_id
  FROM user_bank_accounts
  GROUP BY user_id
) a ON a.user_id = c.user_id
SET c.bank_account_id = a.replacement_account_id
WHERE c.bank_account_id IS NULL;

UPDATE card_applications ca
JOIN (
  SELECT
    user_id,
    COALESCE(MAX(CASE WHEN is_default = 1 THEN id END), MIN(id)) AS replacement_account_id
  FROM user_bank_accounts
  GROUP BY user_id
) a ON a.user_id = ca.user_id
SET ca.bank_account_id = a.replacement_account_id
WHERE ca.bank_account_id IS NULL;
