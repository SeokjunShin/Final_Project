-- Update role description
UPDATE roles SET description = '심사 관리자' WHERE name = 'REVIEW_ADMIN';

-- Update user name
UPDATE users SET name = '심사관리자' WHERE email = 'reviewadmin@mycard.local';
