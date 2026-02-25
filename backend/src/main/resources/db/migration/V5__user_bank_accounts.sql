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
