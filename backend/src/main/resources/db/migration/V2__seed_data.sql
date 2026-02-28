SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Roles
INSERT INTO roles (id, name, description) VALUES
  (1, 'USER', '일반 사용자'),
  (2, 'OPERATOR', '상담원'),
  (3, 'MASTER_ADMIN', '관리자'),
  (4, 'REVIEW_ADMIN', '리뷰 관리자');

-- Users (password: MyCard!234)
INSERT INTO users (id, email, password_hash, name, phone, status) VALUES
  (1,   'user1@mycard.local', '$2a$12$PqcXBVTaFDti5bPDa2k5IOxs0zN9cUTeoN9ZxFocsXmyIaWgx0Yvu', '홍길동', '010-1111-1111', 'ACTIVE'),
  (2,   'user2@mycard.local', '$2a$12$OjbgXXmP6FE.r7FevQhFPOrsxQYlWqNRWOXnIrcA/Qma8.G42eO.y', '김민수', '010-2222-2222', 'ACTIVE'),
  (3,   'reviewadmin@mycard.local', '$2a$12$R85yQRcEWzjqz6f6wyxbLu45tP7BdVvaRsL2m06WcY5h3yBTwQhiq', '리뷰관리자', '010-3333-3333', 'ACTIVE'),
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
  (1, 4500),
  (2, 6500),
  (3, 6200);

INSERT INTO point_ledger (id, user_id, entry_type, amount, balance_after, ref_type, ref_id, memo, created_at) VALUES
  (7001, 1, 'ADJUST', 10000, 10000, NULL, NULL, '신규 가입 보너스', '2026-02-01 09:00:00'),
  (7002, 1, 'EARN',    2500, 12500, 'STATEMENT', 5001, '2월 이용 적립', '2026-03-01 00:05:00'),
  (7003, 1, 'SPEND',  -3000,  9500, NULL, NULL, '기프트 교환', '2026-03-05 12:00:00'),
  (7004, 1, 'CONVERT',-5000,  4500, 'WITHDRAW', 8001, '포인트 현금 전환', '2026-03-06 10:00:00'),

  (7101, 2, 'ADJUST',  8000,  8000, NULL, NULL, '신규 가입 보너스', '2026-02-03 09:00:00'),
  (7102, 2, 'EARN',    1500,  9500, 'STATEMENT', 5101, '2월 이용 적립', '2026-03-01 00:06:00'),
  (7103, 2, 'CONVERT',-3000,  6500, 'WITHDRAW', 8002, '포인트 현금 전환', '2026-03-10 11:00:00'),

  (7201, 3, 'ADJUST',  5000,  5000, NULL, NULL, '신규 가입 보너스', '2026-02-05 09:00:00'),
  (7202, 3, 'EARN',    1200,  6200, 'STATEMENT', 5201, '2월 이용 적립', '2026-03-01 00:07:00');

-- Point Withdrawals
INSERT INTO point_withdrawals (id, user_id, points_amount, cash_amount, fee_amount, bank_name, account_masked, status, requested_at, processed_at) VALUES
  (8001, 1, 5000, 5000, 150, '국민은행', '***-**-1234', 'REQUESTED', '2026-03-06 10:00:00', NULL),
  (8002, 2, 3000, 3000,  90, '신한은행', '***-**-5678', 'PROCESSED', '2026-03-10 11:00:00', '2026-03-10 15:30:00');

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
INSERT INTO events (id, title, content, start_at, end_at, status, created_by, created_at) VALUES
  (99011, '봄맞이 캐시백 이벤트', '기간 내 응모 시 추첨을 통해 캐시백을 제공합니다(모의).', '2026-03-01 00:00:00', '2026-04-30 23:59:59', 'ACTIVE', 201, '2026-03-01 08:00:00');

INSERT INTO event_entries (id, event_id, user_id, entered_at, is_winner, winner_at) VALUES
  (99021, 99011, 1, '2026-03-03 12:00:00', 1, '2026-03-20 10:00:00'),
  (99022, 99011, 2, '2026-03-05 12:00:00', 0, NULL);

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
  (99501, 201, 'ADMIN',    'NOTICE_CREATE',     'NOTICE',    97001, JSON_OBJECT('title','시스템 점검 안내'), 'req-001', '192.168.0.10', 'Mozilla/5.0', '2026-03-20 09:00:01'),
  (99502, 101, 'OPERATOR', 'INQUIRY_ANSWER',    'INQUIRY',   90001, JSON_OBJECT('status','ANSWERED'),       'req-002', '192.168.0.21', 'Mozilla/5.0', '2026-03-02 11:10:01'),
  (99503, 201, 'ADMIN',    'POINT_POLICY_UPD',  'POLICY',    99101, JSON_OBJECT('fee_rate','0.0300'),       'req-003', '192.168.0.10', 'Mozilla/5.0', '2026-03-25 09:00:01');

-- Login attempts 샘플(선택)
INSERT INTO login_attempts (email, user_id, ip, user_agent, success, created_at) VALUES
  ('user1@mycard.local', 1, '192.168.0.50', 'Mozilla/5.0', 1, '2026-03-02 09:59:58'),
  ('user2@mycard.local', 2, '192.168.0.51', 'Mozilla/5.0', 0, '2026-03-07 09:19:58');

SET FOREIGN_KEY_CHECKS = 1;
