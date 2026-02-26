-- 카드 비밀번호 필드 추가 (평문 저장 - 취약점 진단용)
ALTER TABLE cards ADD COLUMN card_password VARCHAR(10) NULL;

-- 카드 신청 시 비밀번호 저장 필드 추가
ALTER TABLE card_applications ADD COLUMN card_password VARCHAR(10) NULL;
