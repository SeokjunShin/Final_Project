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
