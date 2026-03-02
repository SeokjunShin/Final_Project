-- Add pin_code column to user_coupons
ALTER TABLE user_coupons ADD COLUMN pin_code VARCHAR(32);

-- Populate existing rows with a random 16-character string (UUID based)
UPDATE user_coupons SET pin_code = UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 16)) WHERE pin_code IS NULL;

-- Optionally, make it not null
ALTER TABLE user_coupons MODIFY COLUMN pin_code VARCHAR(32) NOT NULL;
