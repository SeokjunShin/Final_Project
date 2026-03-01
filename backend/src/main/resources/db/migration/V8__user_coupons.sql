CREATE TABLE IF NOT EXISTS user_coupons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    coupon_id BIGINT UNSIGNED NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until DATETIME NOT NULL,
    KEY idx_user_coupons_user_time (user_id, purchased_at),
    KEY idx_user_coupons_user_status (user_id, status),
    CONSTRAINT chk_user_coupons_status CHECK (status IN ('AVAILABLE', 'USED', 'EXPIRED')),
    CONSTRAINT fk_user_coupons_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
