-- Update existing ADMIN role to MASTER_ADMIN if it exists with id=3
UPDATE roles SET name = 'MASTER_ADMIN', description = '관리자' WHERE id = 3;

-- Add new REVIEW_ADMIN role
INSERT INTO roles (id, name, description) VALUES (4, 'REVIEW_ADMIN', '심사 관리자')
ON DUPLICATE KEY UPDATE name = 'REVIEW_ADMIN', description = '심사 관리자';

-- Add or update REVIEW_ADMIN user (reviewadmin@mycard.local)
INSERT INTO users (id, email, password_hash, name, phone, status) 
VALUES (3, 'reviewadmin@mycard.local', '$2a$12$R85yQRcEWzjqz6f6wyxbLu45tP7BdVvaRsL2m06WcY5h3yBTwQhiq', '심사관리자', '010-3333-3333', 'ACTIVE')
ON DUPLICATE KEY UPDATE 
  email = 'reviewadmin@mycard.local', 
  password_hash = '$2a$12$R85yQRcEWzjqz6f6wyxbLu45tP7BdVvaRsL2m06WcY5h3yBTwQhiq',
  name = '심사관리자', 
  phone = '010-3333-3333', 
  status = 'ACTIVE';

-- Add or update MASTER_ADMIN user (masteradmin@mycard.local) (id was 201, which used to be admin@mycard.local)
UPDATE users SET email = 'masteradmin@mycard.local', name = '마스터관리자', phone = '010-9999-0201' WHERE id = 201;

-- Ensure user_roles are updated for reviewadmin
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (3, 4);

-- Update user_roles if needed for masteradmin
-- id 201 should have role 3 (MASTER_ADMIN)
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (201, 3);
