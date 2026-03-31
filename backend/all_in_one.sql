-- ALL IN ONE MIGRATION SCRIPT
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- START: V1__init_schema.sql
-- ==========================================
﻿-- V1__init_schema.sql
-- MyCard schema (MySQL 8.x, InnoDB, utf8mb4)
-- NOTE: Flyway does not create DB itself. Create DB (mycard) separately.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  name VARCHAR(80) NOT NULL,
  phone VARCHAR(30) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at DATETIME NULL,
  CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE','LOCKED','DISABLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  user_agent VARCHAR(255) NULL,
  ip VARCHAR(45) NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_refresh_token_hash (token_hash),
  KEY idx_refresh_user (user_id),
  KEY idx_refresh_expires (expires_at),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  ip VARCHAR(45) NOT NULL,
  user_agent VARCHAR(255) NULL,
  success TINYINT(1) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_login_email_time (email, created_at),
  KEY idx_login_user_time (user_id, created_at),
  CONSTRAINT fk_login_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS merchants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_merchants_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS cards (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  card_name VARCHAR(80) NOT NULL,
  network VARCHAR(20) NOT NULL,
  masked_pan VARCHAR(25) NOT NULL,
  last4 CHAR(4) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  limit_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  available_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
  overseas_enabled TINYINT(1) NOT NULL DEFAULT 0,
  issued_at DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cards_user (user_id),
  CONSTRAINT chk_cards_status CHECK (status IN ('ACTIVE','SUSPENDED','LOST','REISSUE_REQUESTED','REISSUED')),
  CONSTRAINT fk_cards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS approvals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  card_id BIGINT UNSIGNED NOT NULL,
  merchant_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KRW',
  status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
  auth_code VARCHAR(20) NOT NULL,
  approved_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_approvals_card_time (card_id, approved_at),
  KEY idx_approvals_merchant_time (merchant_id, approved_at),
  CONSTRAINT chk_approvals_status CHECK (status IN ('APPROVED','CANCELED')),
  CONSTRAINT fk_approvals_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  CONSTRAINT fk_approvals_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS statements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  due_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_statements_user_period (user_id, period_start, period_end),
  CONSTRAINT chk_statements_status CHECK (status IN ('DRAFT','ISSUED','PAID')),
  CONSTRAINT fk_statements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS statement_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  statement_id BIGINT UNSIGNED NOT NULL,
  approval_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_statement_items_approval (approval_id),
  KEY idx_statement_items_statement (statement_id),
  CONSTRAINT fk_stmt_items_statement FOREIGN KEY (statement_id) REFERENCES statements(id) ON DELETE CASCADE,
  CONSTRAINT fk_stmt_items_approval FOREIGN KEY (approval_id) REFERENCES approvals(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS point_balance (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  balance BIGINT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_point_balance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS point_ledger (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  entry_type VARCHAR(20) NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  ref_type VARCHAR(30) NULL,
  ref_id BIGINT UNSIGNED NULL,
  memo VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_point_ledger_user_time (user_id, created_at),
  CONSTRAINT chk_point_ledger_type CHECK (entry_type IN ('EARN','SPEND','CONVERT','ADJUST')),
  CONSTRAINT fk_point_ledger_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS point_withdrawals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  points_amount BIGINT NOT NULL,
  cash_amount DECIMAL(12,2) NOT NULL,
  fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  bank_name VARCHAR(50) NULL,
  account_masked VARCHAR(40) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  KEY idx_withdraw_user_time (user_id, requested_at),
  CONSTRAINT chk_withdraw_status CHECK (status IN ('REQUESTED','PROCESSED','REJECTED')),
  CONSTRAINT fk_withdraw_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS inquiries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  category VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  assigned_operator_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_inq_user_time (user_id, created_at),
  KEY idx_inq_status_time (status, created_at),
  CONSTRAINT chk_inq_status CHECK (status IN ('OPEN','ASSIGNED','ANSWERED','CLOSED')),
  CONSTRAINT fk_inq_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_inq_operator FOREIGN KEY (assigned_operator_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS inquiry_replies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inquiry_id BIGINT UNSIGNED NOT NULL,
  actor_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_inq_replies_inq_time (inquiry_id, created_at),
  CONSTRAINT fk_inq_replies_inq FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
  CONSTRAINT fk_inq_replies_actor FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  doc_type VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  reviewer_id BIGINT UNSIGNED NULL,
  rejection_reason VARCHAR(255) NULL,
  KEY idx_docs_user_status (user_id, status),
  CONSTRAINT chk_docs_status CHECK (status IN ('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED')),
  CONSTRAINT fk_docs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_docs_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS notices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_notice_time (created_at),
  CONSTRAINT fk_notices_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  to_user_id BIGINT UNSIGNED NOT NULL,
  from_user_id BIGINT UNSIGNED NOT NULL,
  subject VARCHAR(200) NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  KEY idx_msg_to_time (to_user_id, created_at),
  CONSTRAINT fk_messages_to FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_from FOREIGN KEY (from_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uploader_id BIGINT UNSIGNED NOT NULL,
  inquiry_id BIGINT UNSIGNED NULL,
  document_id BIGINT UNSIGNED NULL,
  message_id BIGINT UNSIGNED NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  storage_dir VARCHAR(255) NOT NULL,
  content_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  checksum_sha256 CHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_attach_inq (inquiry_id),
  KEY idx_attach_doc (document_id),
  KEY idx_attach_msg (message_id),
  CONSTRAINT fk_attach_uploader FOREIGN KEY (uploader_id) REFERENCES users(id),
  CONSTRAINT fk_attach_inq FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
  CONSTRAINT fk_attach_doc FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_attach_msg FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  CONSTRAINT chk_attach_owner CHECK (
    ((inquiry_id IS NOT NULL) + (document_id IS NOT NULL) + (message_id IS NOT NULL)) = 1
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_events_status_time (status, start_at),
  CONSTRAINT chk_events_status CHECK (status IN ('DRAFT','ACTIVE','CLOSED')),
  CONSTRAINT fk_events_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS event_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  entered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_winner TINYINT(1) NOT NULL DEFAULT 0,
  winner_at DATETIME NULL,
  UNIQUE KEY uq_event_user (event_id, user_id),
  KEY idx_event_entries_event (event_id),
  CONSTRAINT fk_event_entries_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS point_policies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  policy_name VARCHAR(100) NOT NULL,
  fee_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
  daily_withdrawal_limit_points BIGINT NOT NULL DEFAULT 50000,
  min_withdraw_points BIGINT NOT NULL DEFAULT 1000,
  max_withdraw_points BIGINT NOT NULL DEFAULT 50000,
  active TINYINT(1) NOT NULL DEFAULT 1,
  updated_by BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_point_policies_active (active),
  CONSTRAINT fk_point_policies_user FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS loans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  loan_type VARCHAR(20) NOT NULL,
  principal_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  term_months INT UNSIGNED NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME NULL,
  disbursed_at DATETIME NULL,
  repaid_at DATETIME NULL,
  canceled_at DATETIME NULL,
  KEY idx_loans_user_status (user_id, status),
  CONSTRAINT chk_loans_type CHECK (loan_type IN ('CASH_ADVANCE','CARD_LOAN')),
  CONSTRAINT chk_loans_status CHECK (status IN ('REQUESTED','APPROVED','DISBURSED','REPAID','CANCELED')),
  CONSTRAINT fk_loans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS loan_repayments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  loan_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_repay_loan_time (loan_id, paid_at),
  CONSTRAINT fk_repay_loan FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS revolving_settings (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  min_payment_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1000,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_revolving_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS installment_plans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  approval_id BIGINT UNSIGNED NOT NULL,
  months INT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  canceled_at DATETIME NULL,
  UNIQUE KEY uq_installment_approval (approval_id),
  KEY idx_install_user_status (user_id, status),
  CONSTRAINT chk_install_status CHECK (status IN ('ACTIVE','COMPLETED','CANCELED')),
  CONSTRAINT fk_install_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_install_approval FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id BIGINT UNSIGNED NULL,
  actor_role VARCHAR(20) NOT NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(40) NOT NULL,
  target_id BIGINT UNSIGNED NULL,
  diff_json JSON NULL,
  request_id VARCHAR(64) NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_time (created_at),
  KEY idx_audit_actor_time (actor_id, created_at),
  KEY idx_audit_target (target_type, target_id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
-- END: V1__init_schema.sql

-- ==========================================
-- START: V2__seed_data.sql
-- ==========================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Roles
INSERT INTO roles (id, name, description) VALUES
  (1, 'USER', '일반 사용자'),
  (2, 'OPERATOR', '상담원'),
  (3, 'MASTER_ADMIN', '관리자'),
  (4, 'REVIEW_ADMIN', '심사 관리자');

-- Users (password: MyCard!234)
INSERT INTO users (id, email, password_hash, name, phone, status) VALUES
  (1,   'user1@mycard.local', '$2a$12$PqcXBVTaFDti5bPDa2k5IOxs0zN9cUTeoN9ZxFocsXmyIaWgx0Yvu', '홍길동', '010-1111-1111', 'ACTIVE'),
  (2,   'user2@mycard.local', '$2a$12$OjbgXXmP6FE.r7FevQhFPOrsxQYlWqNRWOXnIrcA/Qma8.G42eO.y', '김민수', '010-2222-2222', 'ACTIVE'),
  (3,   'reviewadmin@mycard.local', '$2a$12$R85yQRcEWzjqz6f6wyxbLu45tP7BdVvaRsL2m06WcY5h3yBTwQhiq', '심사관리자', '010-3333-3333', 'ACTIVE'),
  (101, 'op1@mycard.local',   '$2a$12$KTNCtgdgsjcARphzh5bu1eRPfOm4zsHObCjPWm7xwGzSFmUl7S/Kq', '박상담', '010-9000-0101', 'ACTIVE'),
  (102, 'op2@mycard.local',   '$2a$12$abBrL9VdR2WFzBgTzntzpuQ.A2T/.TnG.RWPo3.3S0QFdwGV4qa/K', '최상담', '010-9000-0102', 'ACTIVE'),
  (201, 'masteradmin@mycard.local', '$2a$12$tTR6GAS4iiEHZa0q8O054.nlJuosmt8albvhAqQm8Hrr0VGXwNT/G', '마스터관리자', '010-9999-0201', 'ACTIVE');

-- User Roles
INSERT INTO user_roles (user_id, role_id) VALUES
  (1, 1), (2, 1), (3, 4),
  (101, 2), (102, 2),
  (201, 3);

-- Merchants
INSERT INTO merchants (id, name, category) VALUES
  (1, '스타벅스', 'CAFE'),
  (2, '쿠팡', 'ECOMMERCE'),
  (3, '대한항공', 'AIRLINE'),
  (4, 'GS25', 'CONVENIENCE'),
  (5, 'SK주유소', 'GAS'),
  (6, '이마트', 'MART'),
  (7, '넷플릭스', 'SUBSCRIPTION'),
  (8, '카카오택시', 'TRANSPORT');

-- Cards
INSERT INTO cards (id, user_id, card_name, network, masked_pan, last4, status, limit_amount, available_limit, overseas_enabled, issued_at) VALUES
  (1001, 1, 'MyCard Platinum', 'VISA',   '4532-1234-5678-1234', '1234', 'ACTIVE', 5000000, 4200000, 1, '2025-12-10'),
  (1002, 1, 'MyCard Check',    'MASTER', '5425-9876-5432-5678', '5678', 'ACTIVE', 1500000, 1500000, 0, '2025-11-01'),

  (2001, 2, 'MyCard Gold',      'VISA',   '4716-2345-6789-2345', '2345', 'ACTIVE', 3000000, 2800000, 1, '2025-10-15'),
  (2002, 2, 'MyCard Classic',   'MASTER', '5312-8765-4321-6789', '6789', 'ACTIVE', 2000000, 1900000, 0, '2025-09-20'),

  (3001, 3, 'MyCard Blue',      'VISA',   '4929-3456-7890-3456', '3456', 'ACTIVE', 2500000, 2100000, 1, '2025-08-05'),
  (3002, 3, 'MyCard Junior',    'MASTER', '5198-6543-2109-7890', '7890', 'ACTIVE', 1200000, 1200000, 0, '2025-07-12');

-- Approvals (승인내역)
INSERT INTO approvals (id, card_id, merchant_id, amount, currency, status, auth_code, approved_at) VALUES
  (9001, 1001, 1,  5500,   'KRW', 'APPROVED', 'A10001', '2026-02-05 10:12:00'),
  (9002, 1001, 2,  32000,  'KRW', 'APPROVED', 'A10002', '2026-02-20 21:05:00'),
  (9003, 1001, 3,  180000, 'KRW', 'APPROVED', 'A10003', '2026-03-02 09:30:00'),
  (9004, 1002, 4,  6800,   'KRW', 'APPROVED', 'A10004', '2026-03-10 12:40:00'),
  (9005, 1002, 7,  17000,  'KRW', 'APPROVED', 'A10005', '2026-03-15 23:00:00'),
  (9006, 1002, 8,  12000,  'KRW', 'CANCELED', 'A10006', '2026-03-16 08:00:00'),

  (9101, 2001, 6,  85000,  'KRW', 'APPROVED', 'B20001', '2026-02-08 15:20:00'),
  (9102, 2001, 1,  4900,   'KRW', 'APPROVED', 'B20002', '2026-02-18 09:10:00'),
  (9103, 2002, 5,  67000,  'KRW', 'APPROVED', 'B20003', '2026-03-06 18:25:00'),
  (9104, 2002, 2,  45000,  'KRW', 'APPROVED', 'B20004', '2026-03-21 20:05:00'),
  (9105, 2002, 7,  17000,  'KRW', 'APPROVED', 'B20005', '2026-03-23 22:15:00'),

  (9201, 3001, 2,  23000,  'KRW', 'APPROVED', 'C30001', '2026-02-11 11:11:00'),
  (9202, 3001, 4,  7200,   'KRW', 'APPROVED', 'C30002', '2026-02-27 19:45:00'),
  (9203, 3001, 6,  112000, 'KRW', 'APPROVED', 'C30003', '2026-03-04 14:00:00'),
  (9204, 3002, 8,  9800,   'KRW', 'APPROVED', 'C30004', '2026-03-12 08:40:00'),
  (9205, 3002, 1,  6100,   'KRW', 'APPROVED', 'C30005', '2026-03-26 10:05:00');

-- Statements (명세서)
INSERT INTO statements (id, user_id, period_start, period_end, due_date, due_amount, status) VALUES
  (5001, 1, '2026-02-01', '2026-02-28', '2026-03-15',  37500, 'ISSUED'),
  (5002, 1, '2026-03-01', '2026-03-31', '2026-04-15', 203800, 'ISSUED'),

  (5101, 2, '2026-02-01', '2026-02-28', '2026-03-15',  89900, 'ISSUED'),
  (5102, 2, '2026-03-01', '2026-03-31', '2026-04-15', 129000, 'ISSUED'),

  (5201, 3, '2026-02-01', '2026-02-28', '2026-03-15',  30200, 'ISSUED'),
  (5202, 3, '2026-03-01', '2026-03-31', '2026-04-15', 127900, 'ISSUED');

-- Statement Items (명세서 상세항목)
INSERT INTO statement_items (id, statement_id, approval_id, amount) VALUES
  (6001, 5001, 9001,  5500),
  (6002, 5001, 9002, 32000),

  (6003, 5002, 9003, 180000),
  (6004, 5002, 9004,   6800),
  (6005, 5002, 9005,  17000),

  (6101, 5101, 9101,  85000),
  (6102, 5101, 9102,   4900),

  (6103, 5102, 9103,  67000),
  (6104, 5102, 9104,  45000),
  (6105, 5102, 9105,  17000),

  (6201, 5201, 9201,  23000),
  (6202, 5201, 9202,   7200),

  (6203, 5202, 9203, 112000),
  (6204, 5202, 9204,   9800),
  (6205, 5202, 9205,   6100);

-- Points
INSERT INTO point_balance (user_id, balance) VALUES
  (1, 12500),
  (2, 9500),
  (3, 6200);

INSERT INTO point_ledger (id, user_id, entry_type, amount, balance_after, ref_type, ref_id, memo, created_at) VALUES
  (7001, 1, 'ADJUST', 10000, 10000, NULL, NULL, '신규 가입 보너스', '2026-02-01 09:00:00'),
  (7002, 1, 'EARN',    2500, 12500, 'STATEMENT', 5001, '2월 이용 적립', '2026-03-01 00:05:00'),

  (7101, 2, 'ADJUST',  8000,  8000, NULL, NULL, '신규 가입 보너스', '2026-02-03 09:00:00'),
  (7102, 2, 'EARN',    1500,  9500, 'STATEMENT', 5101, '2월 이용 적립', '2026-03-01 00:06:00'),

  (7201, 3, 'ADJUST',  5000,  5000, NULL, NULL, '신규 가입 보너스', '2026-02-05 09:00:00'),
  (7202, 3, 'EARN',    1200,  6200, 'STATEMENT', 5201, '2월 이용 적립', '2026-03-01 00:07:00');

-- Point Withdrawals
INSERT INTO point_withdrawals (id, user_id, points_amount, cash_amount, fee_amount, bank_name, account_masked, status, requested_at, processed_at) VALUES
  (8000, 1, 0, 0, 0, NULL, NULL, 'REQUESTED', '2023-01-01 00:00:00', NULL);
DELETE FROM point_withdrawals WHERE id = 8000;

-- Customer Support (Inquiries)
INSERT INTO inquiries (id, user_id, category, title, content, status, assigned_operator_id, created_at) VALUES
  (90001, 1, 'BILLING', '명세서 금액이 이상해요', '2월 명세서에 포함된 내역 확인 부탁드립니다.', 'ANSWERED', 101, '2026-03-02 10:00:00'),
  (90002, 2, 'CARD',    '해외결제 차단 설정 문의', '해외 결제를 차단했는데 승인 내역이 보여요.', 'OPEN',     NULL, '2026-03-07 09:20:00'),
  (90003, 3, 'POINT',   '포인트 전환이 안돼요',   '포인트 현금 전환 버튼 클릭 시 오류가 발생합니다.', 'ASSIGNED', 102, '2026-03-12 13:30:00');

INSERT INTO inquiry_replies (id, inquiry_id, actor_id, content, created_at) VALUES
  (91001, 90001, 101, '확인 결과, 취소 건이 반영되기 전 금액으로 보입니다. 1~2영업일 내 자동 반영됩니다.', '2026-03-02 11:10:00');

-- Documents
INSERT INTO documents (id, user_id, doc_type, status, submitted_at, reviewed_at, reviewer_id, rejection_reason) VALUES
  (95001, 1, 'INCOME_PROOF', 'APPROVED',     '2026-03-01 09:00:00', '2026-03-01 10:00:00', 101, NULL),
  (95002, 2, 'ID_CARD',      'UNDER_REVIEW', '2026-03-05 14:00:00', NULL,                  101, NULL),
  (95003, 3, 'INCOME_PROOF', 'REJECTED',     '2026-03-10 09:30:00', '2026-03-10 10:30:00', 102, '사진이 흐려 식별이 어렵습니다.');

-- Notices
INSERT INTO notices (id, title, content, is_published, created_by, created_at) VALUES
  (97001, '시스템 점검 안내', '2026-03-30 02:00~03:00 시스템 점검이 진행됩니다.', 1, 201, '2026-03-20 09:00:00'),
  (97002, '포인트 전환 정책 안내', '포인트 전환 수수료 정책이 변경될 수 있습니다.', 1, 201, '2026-03-25 09:00:00');

-- Messages
INSERT INTO messages (id, to_user_id, from_user_id, subject, content, created_at, read_at) VALUES
  (98001, 1, 101, '문의 답변 안내', '고객님의 문의에 답변이 등록되었습니다. 고객센터에서 확인해주세요.', '2026-03-02 11:12:00', NULL),
  (98002, 3, 102, '문서 반려 안내', '제출하신 서류가 반려되었습니다. 반려 사유를 확인 후 재제출해주세요.', '2026-03-10 10:32:00', NULL);

-- Attachments (문의/문서함에 연결)
INSERT INTO attachments (id, uploader_id, inquiry_id, document_id, message_id, original_filename, stored_filename, storage_dir, content_type, size_bytes, checksum_sha256, created_at) VALUES
  (99001, 1, 90001, NULL, NULL, 'statement_screenshot.png', 'inq_90001_01.png', '/var/lib/mycard/uploads/inquiries', 'image/png', 245670, NULL, '2026-03-02 10:01:00'),
  (99002, 1, NULL, 95001, NULL, 'income_proof.pdf',        'doc_95001_01.pdf', '/var/lib/mycard/uploads/documents', 'application/pdf', 812345, NULL, '2026-03-01 09:01:00'),
  (99003, 3, NULL, 95003, NULL, 'income_proof_blur.jpg',   'doc_95003_01.jpg', '/var/lib/mycard/uploads/documents', 'image/jpeg', 452000, NULL, '2026-03-10 09:31:00');

-- Events
-- (Dummy events removed in favor of real event in V14)

-- Point Policy
INSERT INTO point_policies (id, policy_name, fee_rate, daily_withdrawal_limit_points, min_withdraw_points, max_withdraw_points, active, updated_by) VALUES
  (99101, '기본 포인트 전환 정책', 0.0300, 50000, 1000, 50000, 1, 201);

-- 금융(모의)
INSERT INTO loans (id, user_id, loan_type, principal_amount, interest_rate, term_months, status, requested_at, approved_at, disbursed_at) VALUES
  (99201, 1, 'CASH_ADVANCE', 200000, 12.50, 1, 'DISBURSED', '2026-03-08 09:00:00', '2026-03-08 09:10:00', '2026-03-08 09:12:00');

INSERT INTO loan_repayments (id, loan_id, amount, paid_at) VALUES
  (99211, 99201, 50000, '2026-03-20 18:00:00');

INSERT INTO revolving_settings (user_id, enabled, min_payment_rate) VALUES
  (1, 1, 0.1000),
  (2, 0, 0.1000),
  (3, 0, 0.1000);

INSERT INTO installment_plans (id, user_id, approval_id, months, status, created_at) VALUES
  (99301, 3, 9203, 3, 'ACTIVE', '2026-03-05 09:00:00');

-- Audit Logs (운영 증적 샘플)
INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, diff_json, request_id, ip, user_agent, created_at) VALUES
  (99501, 201, 'MASTER_ADMIN',    'NOTICE_CREATE',     'NOTICE',    97001, JSON_OBJECT('title','시스템 점검 안내'), 'req-001', '192.168.0.10', 'Mozilla/5.0', '2026-03-20 09:00:01'),
  (99502, 101, 'OPERATOR', 'INQUIRY_ANSWER',    'INQUIRY',   90001, JSON_OBJECT('status','ANSWERED'),       'req-002', '192.168.0.21', 'Mozilla/5.0', '2026-03-02 11:10:01'),
  (99503, 201, 'MASTER_ADMIN',    'POINT_POLICY_UPD',  'POLICY',    99101, JSON_OBJECT('fee_rate','0.0300'),       'req-003', '192.168.0.10', 'Mozilla/5.0', '2026-03-25 09:00:01');

-- Login attempts 샘플(선택)
INSERT INTO login_attempts (email, user_id, ip, user_agent, success, created_at) VALUES
  ('user1@mycard.local', 1, '192.168.0.50', 'Mozilla/5.0', 1, '2026-03-02 09:59:58'),
  ('user2@mycard.local', 2, '192.168.0.51', 'Mozilla/5.0', 0, '2026-03-07 09:19:58');

SET FOREIGN_KEY_CHECKS = 1;
-- END: V2__seed_data.sql

-- ==========================================
-- START: V3__user_security_profile_columns.sql
-- ==========================================
-- V3__user_security_profile_columns.sql
-- address 컬럼 추가
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'address'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL AFTER phone'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- two_factor_enabled 컬럼 추가
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'two_factor_enabled'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER status'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V3__user_security_profile_columns.sql

-- ==========================================
-- START: V4__card_applications.sql
-- ==========================================
-- V4__card_applications.sql
-- 카드 신청 테이블

CREATE TABLE IF NOT EXISTS card_applications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  
  -- 개인정보
  full_name VARCHAR(80) NOT NULL,
  ssn_encrypted VARCHAR(500) NOT NULL COMMENT '주민번호 (AES-GCM 암호화)',
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(190) NOT NULL,
  address VARCHAR(255) NOT NULL,
  address_detail VARCHAR(255) NULL,
  
  -- 직업/소득 정보
  employment_type VARCHAR(30) NOT NULL COMMENT 'EMPLOYED, SELF_EMPLOYED, FREELANCER, STUDENT, HOUSEWIFE, UNEMPLOYED, RETIRED',
  employer_name VARCHAR(120) NULL,
  job_title VARCHAR(100) NULL,
  annual_income_encrypted VARCHAR(500) NOT NULL COMMENT '연소득 (AES-GCM 암호화)',
  
  -- 신청 카드 정보
  card_type VARCHAR(50) NOT NULL COMMENT 'VISA, MASTERCARD, LOCAL',
  card_product VARCHAR(100) NOT NULL COMMENT '플래티넘, 골드, 일반 등',
  requested_limit DECIMAL(12,2) NULL COMMENT '희망 신용한도',
  
  -- 상태
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, REVIEWING, APPROVED, REJECTED',
  
  -- 심사 정보
  reviewed_by BIGINT UNSIGNED NULL COMMENT '심사한 관리자',
  reviewed_at DATETIME NULL,
  rejection_reason VARCHAR(500) NULL COMMENT '거절 사유',
  approved_limit DECIMAL(12,2) NULL COMMENT '승인된 신용한도',
  issued_card_id BIGINT UNSIGNED NULL COMMENT '승인 후 발급된 카드',
  admin_notes VARCHAR(1000) NULL COMMENT '관리자 메모',
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_card_app_user (user_id),
  KEY idx_card_app_status (status),
  KEY idx_card_app_created (created_at),
  
  CONSTRAINT chk_card_app_status CHECK (status IN ('PENDING','REVIEWING','APPROVED','REJECTED')),
  CONSTRAINT chk_card_app_employment CHECK (employment_type IN ('EMPLOYED','SELF_EMPLOYED','FREELANCER','STUDENT','HOUSEWIFE','UNEMPLOYED','RETIRED')),
  
  CONSTRAINT fk_card_app_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_card_app_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_card_app_issued_card FOREIGN KEY (issued_card_id) REFERENCES cards(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- END: V4__card_applications.sql

-- ==========================================
-- START: V5__user_bank_accounts.sql
-- ==========================================
-- 사용자 은행 계좌 테이블
CREATE TABLE IF NOT EXISTS user_bank_accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    bank_code VARCHAR(10) NOT NULL COMMENT '은행코드 (예: 004=KB국민, 088=신한)',
    bank_name VARCHAR(50) NOT NULL COMMENT '은행명',
    account_number_encrypted VARCHAR(255) NOT NULL COMMENT '계좌번호 (암호화)',
    account_number_masked VARCHAR(30) NOT NULL COMMENT '마스킹된 계좌번호',
    account_holder VARCHAR(50) NOT NULL COMMENT '예금주명',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT '계좌 인증 여부',
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT '기본 출금 계좌',
    verified_at DATETIME NULL COMMENT '인증 완료 시간',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_bank_account_user (user_id),
    INDEX idx_bank_account_default (user_id, is_default),
    CONSTRAINT fk_bank_account_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 한국 주요 은행 코드 참조 테이블
CREATE TABLE IF NOT EXISTS bank_codes (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    swift_code VARCHAR(20) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 주요 은행 코드 데이터 삽입
INSERT INTO bank_codes (code, name, swift_code, is_active) VALUES
('004', 'KB국민은행', 'CZNBKRSE', TRUE),
('088', '신한은행', 'SHBKKRSE', TRUE),
('020', '우리은행', 'HVBKKRSEXXX', TRUE),
('081', '하나은행', 'HNBNKRSE', TRUE),
('003', 'IBK기업은행', 'IBKOKRSE', TRUE),
('011', 'NH농협은행', 'NACFKRSE', TRUE),
('023', 'SC제일은행', 'SCBLKRSE', TRUE),
('027', '한국씨티은행', 'CITIKRSX', TRUE),
('031', '대구은행', 'DAABORAX', TRUE),
('032', '부산은행', 'PUSBKR2P', TRUE),
('034', '광주은행', 'KWABKRSE', TRUE),
('035', '제주은행', 'JJBKKR22', TRUE),
('037', '전북은행', 'JEONKRSE', TRUE),
('039', '경남은행', 'KABORAX', TRUE),
('045', '새마을금고', NULL, TRUE),
('048', '신협', NULL, TRUE),
('071', '우체국', NULL, TRUE),
('089', '케이뱅크', NULL, TRUE),
('090', '카카오뱅크', NULL, TRUE),
('092', '토스뱅크', NULL, TRUE);
-- END: V5__user_bank_accounts.sql

-- ==========================================
-- START: V6__card_password.sql
-- ==========================================
-- 카드 비밀번호 필드 추가 (평문 저장 - 취약점 진단용)
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'cards'
        AND column_name = 'card_password'
    ),
    'SELECT 1',
    'ALTER TABLE cards ADD COLUMN card_password VARCHAR(10) NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 카드 신청 시 비밀번호 저장 필드 추가
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'card_applications'
        AND column_name = 'card_password'
    ),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN card_password VARCHAR(10) NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V6__card_password.sql

-- ==========================================
-- START: V7__event_image_url.sql
-- ==========================================
-- V6__event_image_url.sql
-- events 테이블에 image_url 컬럼 추가

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'events'
        AND column_name = 'image_url'
    ),
    'SELECT 1',
    'ALTER TABLE events ADD COLUMN image_url VARCHAR(500) NULL AFTER status'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V7__event_image_url.sql

-- ==========================================
-- START: V8__add_secondary_password_column.sql
-- ==========================================
-- secondary_password 컬럼 추가
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'secondary_password'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN secondary_password VARCHAR(100) NULL AFTER password_hash'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V8__add_secondary_password_column.sql

-- ==========================================
-- START: V9__coupon_system.sql
-- ==========================================
-- Coupon definitions and user coupon ownership history
-- for e-coupon exchange APIs

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS coupon_catalog (
  id BIGINT UNSIGNED PRIMARY KEY,
  point_cost BIGINT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_coupons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  coupon_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  purchased_at DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user_coupon_user_status (user_id, status),
  KEY idx_user_coupon_coupon (coupon_id),
  CONSTRAINT fk_user_coupons_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_coupons_coupon FOREIGN KEY (coupon_id) REFERENCES coupon_catalog(id),
  CONSTRAINT chk_user_coupon_status CHECK (status IN ('AVAILABLE','USED','EXPIRED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO coupon_catalog (id, point_cost) VALUES
  (1, 4000),
  (2, 8000),
  (3, 4000),
  (4, 3600),
  (5, 3440),
  (6, 1600),
  (7, 17600),
  (8, 6000),
  (9, 40000),
  (10, 8000),
  (11, 24000),
  (12, 24000),
  (13, 40000),
  (14, 8000),
  (15, 4000);

SET FOREIGN_KEY_CHECKS = 1;
-- END: V9__coupon_system.sql

-- ==========================================
-- START: V10__update_admin_roles.sql
-- ==========================================
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
-- END: V10__update_admin_roles.sql

-- ==========================================
-- START: V11__rename_review_admin_to_simsa.sql
-- ==========================================
-- Update role description
UPDATE roles SET description = '심사 관리자' WHERE name = 'REVIEW_ADMIN';

-- Update user name
UPDATE users SET name = '심사관리자' WHERE email = 'reviewadmin@mycard.local';
-- END: V11__rename_review_admin_to_simsa.sql

-- ==========================================
-- START: V12__add_pin_to_user_coupons.sql
-- ==========================================
-- Add pin_code column to user_coupons
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'user_coupons'
        AND column_name = 'pin_code'
    ),
    'SELECT 1',
    'ALTER TABLE user_coupons ADD COLUMN pin_code VARCHAR(32)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Populate existing rows with a random 16-character string (UUID based)
UPDATE user_coupons
SET pin_code = UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 16))
WHERE pin_code IS NULL;

-- Optionally, make it not null
ALTER TABLE user_coupons MODIFY COLUMN pin_code VARCHAR(32) NOT NULL;
-- END: V12__add_pin_to_user_coupons.sql

-- ==========================================
-- START: V13__update_cards_pan_to_full.sql
-- ==========================================
-- V13__update_cards_pan_to_full.sql
UPDATE cards SET masked_pan = '4532-1234-5678-1234' WHERE id = 1001;
UPDATE cards SET masked_pan = '5425-9876-5432-5678' WHERE id = 1002;
UPDATE cards SET masked_pan = '4716-2345-6789-2345' WHERE id = 2001;
UPDATE cards SET masked_pan = '5312-8765-4321-6789' WHERE id = 2002;
UPDATE cards SET masked_pan = '4929-3456-7890-3456' WHERE id = 3001;
UPDATE cards SET masked_pan = '5198-6543-2109-7890' WHERE id = 3002;
-- END: V13__update_cards_pan_to_full.sql

-- ==========================================
-- START: V14__add_random_point_event.sql
-- ==========================================
-- V14__add_random_point_event.sql

-- 기존 더미 이벤트 삭제 (이미 V2가 실행된 DB 대응)
DELETE FROM event_entries WHERE event_id = 99011;
DELETE FROM events WHERE id = 99011;

-- 새 랜덤 포인트 이벤트 추가
INSERT INTO events (id, title, content, start_at, end_at, status, created_by, image_url, created_at, updated_at) VALUES 
(20000, 
'[오픈 기념] 100% 당첨! 매일매일 랜덤 포인트 뽑기', 
'MyCard 오픈을 기념하여 매일 100% 당첨되는 랜덤 포인트 뽑기 이벤트를 진행합니다!<br/><br/>하루에 한 번 참여하고 최소 100P에서 최대 50,000P까지 행운의 주인공이 되어보세요.<br/>매일 새로운 기회가 찾아옵니다!<br/><br/>* 지급된 포인트는 즉시 사용 가능합니다.<br/>* 부정 참여 시 포인트가 회수될 수 있습니다.', 
'2026-01-01 00:00:00', 
'2026-12-31 23:59:59', 
'ACTIVE', 
201, 
'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80', 
NOW(), 
NOW());
-- END: V14__add_random_point_event.sql

-- ==========================================
-- START: V15__update_event_signup_and_remove_html.sql
-- ==========================================
-- V15__update_event_signup_and_remove_html.sql

UPDATE events 
SET title = '[신규가입 혜택] 회원가입 즉시 5,000P 100% 지급',
    content = 'MyCard 오픈을 기념하여 신규 가입하신 모든 회원님들께 5,000P를 즉시 지급해 드립니다!\r\n\r\n지급된 포인트는 e쿠폰 교환 또는 결제 시 현금처럼 사용할 수 있습니다. 지금 바로 혜택을 누려보세요!\r\n\r\n* 본 이벤트는 당사 사정에 의해 사전 고지 없이 조기 종료될 수 있습니다.\r\n* 탈퇴 후 재가입 시 혜택이 중복 지급되지 않습니다.'
WHERE id = 20000;
-- END: V15__update_event_signup_and_remove_html.sql

-- ==========================================
-- START: V16__remove_future_point_data.sql
-- ==========================================
-- V16__remove_future_point_data.sql

-- 미래 날짜로 되어 있는 포인트 지출 항목 삭제
DELETE FROM point_ledger WHERE id IN (7003, 7004, 7103);
-- 이와 연관된 포인트 전환내역 삭제
DELETE FROM point_withdrawals WHERE id IN (8001, 8002);

-- 소진되지 않은 상태로 잔액 원복
UPDATE point_balance SET balance = 12500 WHERE user_id = 1;
UPDATE point_balance SET balance = 9500 WHERE user_id = 2;
-- END: V16__remove_future_point_data.sql

-- ==========================================
-- START: V17__withdrawal_and_card_application_extensions.sql
-- ==========================================
-- 회원 탈퇴 및 카드 신청 확장

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'withdrawn_at'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawn_at DATETIME NULL AFTER last_login_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'withdrawal_reason'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawal_reason VARCHAR(255) NULL AFTER withdrawn_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND constraint_name = 'chk_users_status'
        AND constraint_type = 'CHECK'
    ),
    'ALTER TABLE users DROP CHECK chk_users_status',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE users
  ADD CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE','LOCKED','DISABLED','WITHDRAWN'));

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'card_applications'
        AND column_name = 'bank_account_id'
    ),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN bank_account_id BIGINT UNSIGNED NULL AFTER requested_limit'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'card_applications'
        AND column_name = 'privacy_consent_yn'
    ),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN privacy_consent_yn TINYINT(1) NOT NULL DEFAULT 0 AFTER bank_account_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'card_applications'
        AND column_name = 'privacy_consented_at'
    ),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN privacy_consented_at DATETIME NULL AFTER privacy_consent_yn'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'card_applications'
        AND column_name = 'privacy_policy_version'
    ),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN privacy_policy_version VARCHAR(30) NULL AFTER privacy_consented_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'card_applications'
        AND column_name = 'retention_until'
    ),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN retention_until DATETIME NULL AFTER admin_notes'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'card_applications'
        AND constraint_name = 'fk_card_app_bank_account'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'SELECT 1',
    'ALTER TABLE card_applications ADD CONSTRAINT fk_card_app_bank_account FOREIGN KEY (bank_account_id) REFERENCES user_bank_accounts(id) ON DELETE SET NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'documents'
        AND column_name = 'card_application_id'
    ),
    'SELECT 1',
    'ALTER TABLE documents ADD COLUMN card_application_id BIGINT UNSIGNED NULL AFTER user_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'documents'
        AND constraint_name = 'fk_docs_card_application'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'SELECT 1',
    'ALTER TABLE documents ADD CONSTRAINT fk_docs_card_application FOREIGN KEY (card_application_id) REFERENCES card_applications(id) ON DELETE SET NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'documents'
        AND index_name = 'idx_docs_card_application'
    ),
    'SELECT 1',
    'CREATE INDEX idx_docs_card_application ON documents(card_application_id)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V17__withdrawal_and_card_application_extensions.sql

-- ==========================================
-- START: V18__repair_missing_v17_columns.sql
-- ==========================================
-- V17 이력이 찍혀 있지만 실제 컬럼이 누락된 DB 복구용

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'withdrawn_at'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawn_at DATETIME NULL AFTER last_login_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'withdrawal_reason'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawal_reason VARCHAR(255) NULL AFTER withdrawn_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'card_applications' AND column_name = 'bank_account_id'),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN bank_account_id BIGINT UNSIGNED NULL AFTER requested_limit'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'card_applications' AND column_name = 'privacy_consent_yn'),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN privacy_consent_yn TINYINT(1) NOT NULL DEFAULT 0 AFTER bank_account_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'card_applications' AND column_name = 'privacy_consented_at'),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN privacy_consented_at DATETIME NULL AFTER privacy_consent_yn'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'card_applications' AND column_name = 'privacy_policy_version'),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN privacy_policy_version VARCHAR(30) NULL AFTER privacy_consented_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'card_applications' AND column_name = 'retention_until'),
    'SELECT 1',
    'ALTER TABLE card_applications ADD COLUMN retention_until DATETIME NULL AFTER admin_notes'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'documents' AND column_name = 'card_application_id'),
    'SELECT 1',
    'ALTER TABLE documents ADD COLUMN card_application_id BIGINT UNSIGNED NULL AFTER user_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V18__repair_missing_v17_columns.sql

-- ==========================================
-- START: V19__link_cards_to_bank_accounts.sql
-- ==========================================
-- 발급 카드에 연결 계좌를 실제로 저장

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'cards'
        AND column_name = 'bank_account_id'
    ),
    'SELECT 1',
    'ALTER TABLE cards ADD COLUMN bank_account_id BIGINT UNSIGNED NULL AFTER user_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'cards'
        AND constraint_name = 'fk_cards_bank_account'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'SELECT 1',
    'ALTER TABLE cards ADD CONSTRAINT fk_cards_bank_account FOREIGN KEY (bank_account_id) REFERENCES user_bank_accounts(id) ON DELETE SET NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'cards'
        AND index_name = 'idx_cards_bank_account'
    ),
    'SELECT 1',
    'CREATE INDEX idx_cards_bank_account ON cards(bank_account_id)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE cards c
JOIN card_applications ca ON ca.issued_card_id = c.id
SET c.bank_account_id = ca.bank_account_id
WHERE ca.bank_account_id IS NOT NULL
  AND c.bank_account_id IS NULL;
-- END: V19__link_cards_to_bank_accounts.sql

-- ==========================================
-- START: V20__seed_bank_accounts_for_initial_cards.sql
-- ==========================================
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
-- END: V20__seed_bank_accounts_for_initial_cards.sql

-- ==========================================
-- START: V21__relink_orphaned_card_accounts.sql
-- ==========================================
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
-- END: V21__relink_orphaned_card_accounts.sql

-- ==========================================
-- START: V22__map_loans_to_cards.sql
-- ==========================================
-- 대출과 실제 카드 매핑 추가

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'loans'
        AND column_name = 'card_id'
    ),
    'SELECT 1',
    'ALTER TABLE loans ADD COLUMN card_id BIGINT UNSIGNED NULL AFTER user_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'loans'
        AND constraint_name = 'fk_loans_card'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'SELECT 1',
    'ALTER TABLE loans ADD CONSTRAINT fk_loans_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'loans'
        AND index_name = 'idx_loans_card_status'
    ),
    'SELECT 1',
    'CREATE INDEX idx_loans_card_status ON loans(card_id, status)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE loans l
JOIN (
  SELECT user_id, MIN(id) AS first_card_id
  FROM cards
  GROUP BY user_id
) c ON c.user_id = l.user_id
SET l.card_id = c.first_card_id
WHERE l.card_id IS NULL;
-- END: V22__map_loans_to_cards.sql

-- ==========================================
-- START: V23__add_pending_withdrawal_columns.sql
-- ==========================================
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'withdrawal_requested_at'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawal_requested_at DATETIME NULL AFTER withdrawal_reason'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'withdrawal_scheduled_at'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawal_scheduled_at DATETIME NULL AFTER withdrawal_requested_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V23__add_pending_withdrawal_columns.sql

-- ==========================================
-- START: V24__repair_missing_pending_withdrawal_columns.sql
-- ==========================================
-- V23 이력이 누락되었거나 컬럼이 실제로 반영되지 않은 DB 복구용

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'withdrawal_requested_at'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawal_requested_at DATETIME NULL AFTER withdrawal_reason'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'withdrawal_scheduled_at'),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN withdrawal_scheduled_at DATETIME NULL AFTER withdrawal_requested_at'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V24__repair_missing_pending_withdrawal_columns.sql

-- ==========================================
-- START: V25__allow_withdrawal_pending_status.sql
-- ==========================================
-- 회원 상태 체크 제약에 WITHDRAWAL_PENDING 추가

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND constraint_name = 'chk_users_status'
        AND constraint_type = 'CHECK'
    ),
    'ALTER TABLE users DROP CHECK chk_users_status',
    'SELECT 1'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND constraint_name = 'chk_users_status'
        AND constraint_type = 'CHECK'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD CONSTRAINT chk_users_status CHECK (status IN (''ACTIVE'',''LOCKED'',''DISABLED'',''WITHDRAWN'',''WITHDRAWAL_PENDING''))'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V25__allow_withdrawal_pending_status.sql

-- ==========================================
-- START: V26__add_loan_bank_account_mapping.sql
-- ==========================================
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'loans'
        AND column_name = 'bank_account_id'
    ),
    'SELECT 1',
    'ALTER TABLE loans ADD COLUMN bank_account_id BIGINT UNSIGNED NULL AFTER card_id'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = 'loans'
        AND constraint_name = 'fk_loans_bank_account'
        AND constraint_type = 'FOREIGN KEY'
    ),
    'SELECT 1',
    'ALTER TABLE loans ADD CONSTRAINT fk_loans_bank_account FOREIGN KEY (bank_account_id) REFERENCES user_bank_accounts(id) ON DELETE SET NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'loans'
        AND index_name = 'idx_loans_bank_account_status'
    ),
    'SELECT 1',
    'CREATE INDEX idx_loans_bank_account_status ON loans(bank_account_id, status)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE loans l
JOIN cards c ON c.id = l.card_id
SET l.bank_account_id = c.bank_account_id
WHERE l.bank_account_id IS NULL
  AND c.bank_account_id IS NOT NULL;
-- END: V26__add_loan_bank_account_mapping.sql

-- ==========================================
-- START: V27__add_bank_account_transactions.sql
-- ==========================================
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
-- END: V27__add_bank_account_transactions.sql

-- ==========================================
-- START: V28__add_bank_account_balances.sql
-- ==========================================
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
-- END: V28__add_bank_account_balances.sql

-- ==========================================
-- START: V29__create_board_table.sql
-- ==========================================
CREATE TABLE IF NOT EXISTS boards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO boards (title, content, author_name)
SELECT '환영합니다!', '새로운 자유게시판입니다. 자유롭게 글을 남겨주세요.', '관리자'
WHERE NOT EXISTS (
    SELECT 1
    FROM boards
    WHERE title = '환영합니다!'
      AND author_name = '관리자'
);

INSERT INTO boards (title, content, author_name)
SELECT '질문있습니다', '카드 발급은 얼마나 걸리나요?', '궁금한유저'
WHERE NOT EXISTS (
    SELECT 1
    FROM boards
    WHERE title = '질문있습니다'
      AND author_name = '궁금한유저'
);
-- END: V29__create_board_table.sql

-- ==========================================
-- START: V30__add_is_private_to_boards.sql
-- ==========================================
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'boards'
        AND column_name = 'is_private'
    ),
    'SELECT 1',
    'ALTER TABLE boards ADD COLUMN is_private BOOLEAN DEFAULT FALSE'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V30__add_is_private_to_boards.sql

-- ==========================================
-- START: V32__add_answer_to_boards.sql
-- ==========================================
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'boards'
        AND column_name = 'answer'
    ),
    'SELECT 1',
    'ALTER TABLE boards ADD COLUMN answer TEXT DEFAULT NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V32__add_answer_to_boards.sql

-- ==========================================
-- START: V33__add_security_question_to_users.sql
-- ==========================================
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'security_question'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN security_question VARCHAR(255)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'security_answer'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN security_answer VARCHAR(255)'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V33__add_security_question_to_users.sql

-- ==========================================
-- START: V34__seed_default_security_question_for_users.sql
-- ==========================================
-- V34__seed_default_security_question_for_users.sql
-- Assign a default security question and answer to existing users

UPDATE users
SET security_question = '내가 다녔던 초등학교 이름은?',
    security_answer = '새싹초등학교'
WHERE security_question IS NULL;
-- END: V34__seed_default_security_question_for_users.sql

-- ==========================================
-- START: V35__add_category_and_allowed_users_to_boards.sql
-- ==========================================
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'boards'
        AND column_name = 'category'
    ),
    'SELECT 1',
    'ALTER TABLE boards ADD COLUMN category VARCHAR(100) DEFAULT ''사이트 문의'''
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'boards'
        AND column_name = 'allowed_users'
    ),
    'SELECT 1',
    'ALTER TABLE boards ADD COLUMN allowed_users TEXT DEFAULT NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V35__add_category_and_allowed_users_to_boards.sql

-- ==========================================
-- START: V36__add_board_answer_metadata.sql
-- ==========================================
SET @add_answer_author_name = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'boards'
              AND column_name = 'answer_author_name'
        ),
        'SELECT 1',
        'ALTER TABLE boards ADD COLUMN answer_author_name VARCHAR(100) DEFAULT NULL'
    )
);
PREPARE stmt FROM @add_answer_author_name;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_answer_updated_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'boards'
              AND column_name = 'answer_updated_at'
        ),
        'SELECT 1',
        'ALTER TABLE boards ADD COLUMN answer_updated_at TIMESTAMP NULL DEFAULT NULL'
    )
);
PREPARE stmt FROM @add_answer_updated_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE boards
SET answer_author_name = '관리자',
    answer_updated_at = updated_at
WHERE answer IS NOT NULL
  AND TRIM(answer) <> ''
  AND answer_author_name IS NULL;
-- END: V36__add_board_answer_metadata.sql

-- ==========================================
-- START: V37__add_second_auth_state_to_refresh_tokens.sql
-- ==========================================
SET @add_session_id = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'session_id'
        ),
        'SELECT 1',
        'ALTER TABLE refresh_tokens ADD COLUMN session_id VARCHAR(36) NULL AFTER user_id'
    )
);
PREPARE stmt FROM @add_session_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_second_auth_verified = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'second_auth_verified'
        ),
        'SELECT 1',
        'ALTER TABLE refresh_tokens ADD COLUMN second_auth_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER token_hash'
    )
);
PREPARE stmt FROM @add_second_auth_verified;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE refresh_tokens
SET session_id = UUID()
WHERE session_id IS NULL;

SET @modify_session_id = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'session_id'
        ),
        'ALTER TABLE refresh_tokens MODIFY COLUMN session_id VARCHAR(36) NOT NULL',
        'SELECT 1'
    )
);
PREPARE stmt FROM @modify_session_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_refresh_user_session_index = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND index_name = 'idx_refresh_user_session'
        ),
        'SELECT 1',
        'CREATE INDEX idx_refresh_user_session ON refresh_tokens (user_id, session_id)'
    )
);
PREPARE stmt FROM @add_refresh_user_session_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- END: V37__add_second_auth_state_to_refresh_tokens.sql

-- ==========================================
-- START: V38__add_login_lockout_columns.sql
-- ==========================================
-- 사용자 계정 잠금 정보를 DB에 영구 저장 (기존 @Transient -> 컬럼 추가)
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'failed_login_attempts'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'lock_expiry_time'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN lock_expiry_time DATETIME NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V38__add_login_lockout_columns.sql

-- ==========================================
-- START: V39__add_last_failed_login_at.sql
-- ==========================================
-- Add last_failed_login_at column for time-based brute-force detection
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'last_failed_login_at'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN last_failed_login_at TIMESTAMP NULL'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- END: V39__add_last_failed_login_at.sql

-- ==========================================
-- START: V40__add_google_otp_recovery_columns.sql
-- ==========================================
SET @add_otp_secret = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'users'
              AND column_name = 'otp_secret'
        ),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN otp_secret VARCHAR(64) NULL AFTER security_answer'
    )
);
PREPARE stmt FROM @add_otp_secret;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_otp_enabled = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'users'
              AND column_name = 'otp_enabled'
        ),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN otp_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER otp_secret'
    )
);
PREPARE stmt FROM @add_otp_enabled;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- END: V40__add_google_otp_recovery_columns.sql

-- ==========================================
-- START: V41__seed_admin_secondary_password.sql
-- ==========================================
-- 기존 관리자들 (MASTER_ADMIN, REVIEW_ADMIN, OPERATOR) 중 2차 비밀번호가 설정되지 않은 경우
-- 기본값 '123456'의 Spring Security BCrypt 해시값으로 일괄 업데이트합니다.
-- 해시값: $2a$10$8.UnVuG9HLROJOsI7wQxEce1M1X/bE4P9W5zL2rK8FqjDq.GqHj.u (123456)

UPDATE users 
SET secondary_password = '$2a$10$8.UnVuG9HLROJOsI7wQxEce1M1X/bE4P9W5zL2rK8FqjDq.GqHj.u'
WHERE secondary_password IS NULL
AND id IN (
    SELECT temp.user_id FROM (
        SELECT ur.user_id FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name IN ('MASTER_ADMIN', 'REVIEW_ADMIN', 'OPERATOR')
    ) AS temp
);
-- END: V41__seed_admin_secondary_password.sql

-- ==========================================
-- START: V42__strengthen_refresh_token_sessions.sql
-- ==========================================
SET @add_session_started_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'session_started_at'
        ),
        'SELECT 1',
        'ALTER TABLE refresh_tokens ADD COLUMN session_started_at DATETIME(6) NULL AFTER expires_at'
    )
);
PREPARE stmt FROM @add_session_started_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_absolute_expires_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'absolute_expires_at'
        ),
        'SELECT 1',
        'ALTER TABLE refresh_tokens ADD COLUMN absolute_expires_at DATETIME(6) NULL AFTER session_started_at'
    )
);
PREPARE stmt FROM @add_absolute_expires_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE refresh_tokens
SET session_started_at = COALESCE(created_at, NOW(6)),
    absolute_expires_at = DATE_ADD(COALESCE(created_at, NOW(6)), INTERVAL 30 DAY)
WHERE session_started_at IS NULL
   OR absolute_expires_at IS NULL;

SET @modify_session_started_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'session_started_at'
              AND is_nullable = 'YES'
        ),
        'ALTER TABLE refresh_tokens MODIFY COLUMN session_started_at DATETIME(6) NOT NULL',
        'SELECT 1'
    )
);
PREPARE stmt FROM @modify_session_started_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @modify_absolute_expires_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND column_name = 'absolute_expires_at'
              AND is_nullable = 'YES'
        ),
        'ALTER TABLE refresh_tokens MODIFY COLUMN absolute_expires_at DATETIME(6) NOT NULL',
        'SELECT 1'
    )
);
PREPARE stmt FROM @modify_absolute_expires_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_index_refresh_tokens_active = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'refresh_tokens'
              AND index_name = 'idx_refresh_tokens_user_session_active'
        ),
        'SELECT 1',
        'CREATE INDEX idx_refresh_tokens_user_session_active ON refresh_tokens (user_id, session_id, revoked_at, expires_at, absolute_expires_at)'
    )
);
PREPARE stmt FROM @add_index_refresh_tokens_active;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- END: V42__strengthen_refresh_token_sessions.sql

-- ==========================================
-- START: V43__persist_login_failure_state.sql
-- ==========================================
SET @add_failed_login_attempts = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'users'
              AND column_name = 'failed_login_attempts'
        ),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0 AFTER status'
    )
);
PREPARE stmt FROM @add_failed_login_attempts;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_lock_expiry_time = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'users'
              AND column_name = 'lock_expiry_time'
        ),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN lock_expiry_time DATETIME(6) NULL AFTER failed_login_attempts'
    )
);
PREPARE stmt FROM @add_lock_expiry_time;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE users
SET failed_login_attempts = COALESCE(failed_login_attempts, 0)
WHERE failed_login_attempts IS NULL;
-- END: V43__persist_login_failure_state.sql

-- ==========================================
-- START: V100__final_admin_sync.sql
-- ==========================================
-- [V100] 관리자 및 운영자 계정 2차 비밀번호 일괄 강제 동기화 (최종 확정본)
-- 권한(Role) 기반으로 MASTER_ADMIN, REVIEW_ADMIN, OPERATOR 권한을 가진 모든 계정을 동기화합니다.

UPDATE users 
SET secondary_password = '$2a$10$/J3GJ6b8HrPoB42hDe4I9OGXzGDedjahgVaSfEu8fUBTuxS0M/lF6'
WHERE id IN (
    SELECT ur.user_id 
    FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE r.name IN ('MASTER_ADMIN', 'REVIEW_ADMIN', 'OPERATOR')
);
-- END: V100__final_admin_sync.sql

SET FOREIGN_KEY_CHECKS = 1;
