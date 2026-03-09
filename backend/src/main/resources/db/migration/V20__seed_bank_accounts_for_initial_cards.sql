-- 초기 시드 카드 사용자용 기본 결제계좌 보정

INSERT INTO user_bank_accounts (
  user_id,
  bank_code,
  bank_name,
  account_number_encrypted,
  account_number_masked,
  account_holder,
  is_verified,
  is_default,
  verified_at
)
SELECT 1, '004', 'KB국민은행', 'dt7RxNbU+njdGrwtEWo58nRzHzKD5Qm3c/4o2297nKy6f3VjgsAmQA==', '********7890', '홍길동', 1, 1, NOW()
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1)
  AND EXISTS (SELECT 1 FROM cards WHERE user_id = 1)
  AND NOT EXISTS (SELECT 1 FROM user_bank_accounts WHERE user_id = 1);

INSERT INTO user_bank_accounts (
  user_id,
  bank_code,
  bank_name,
  account_number_encrypted,
  account_number_masked,
  account_holder,
  is_verified,
  is_default,
  verified_at
)
SELECT 2, '088', '신한은행', '05O967MjjzxL1gkRA/wTWHuVey0XngijE8YGslgVhHAys9Hbrt0qfg==', '********7890', '김민수', 1, 1, NOW()
WHERE EXISTS (SELECT 1 FROM users WHERE id = 2)
  AND EXISTS (SELECT 1 FROM cards WHERE user_id = 2)
  AND NOT EXISTS (SELECT 1 FROM user_bank_accounts WHERE user_id = 2);

INSERT INTO user_bank_accounts (
  user_id,
  bank_code,
  bank_name,
  account_number_encrypted,
  account_number_masked,
  account_holder,
  is_verified,
  is_default,
  verified_at
)
SELECT 3, '081', '하나은행', '9ar2j6TVicIzc6MUkiX6D4ieE0Lvdked2vL61dfCKyeeC9TrD0ps6w==', '********7890', '심사관리자', 1, 1, NOW()
WHERE EXISTS (SELECT 1 FROM users WHERE id = 3)
  AND EXISTS (SELECT 1 FROM cards WHERE user_id = 3)
  AND NOT EXISTS (SELECT 1 FROM user_bank_accounts WHERE user_id = 3);

UPDATE cards c
JOIN (
  SELECT
    user_id,
    COALESCE(MAX(CASE WHEN is_default = 1 THEN id END), MIN(id)) AS bank_account_id
  FROM user_bank_accounts
  GROUP BY user_id
) a ON a.user_id = c.user_id
SET c.bank_account_id = a.bank_account_id
WHERE c.bank_account_id IS NULL;
