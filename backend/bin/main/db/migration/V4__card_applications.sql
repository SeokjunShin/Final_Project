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
