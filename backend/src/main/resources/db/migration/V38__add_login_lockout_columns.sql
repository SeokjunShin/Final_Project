-- 사용자 계정 잠금 정보를 DB에 영구 저장 (기존 @Transient → 컬럼 추가)
ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN lock_expiry_time DATETIME NULL;
