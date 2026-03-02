-- secondary_password 컬럼 추가
ALTER TABLE users ADD COLUMN secondary_password VARCHAR(100) NULL AFTER password_hash;
