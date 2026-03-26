-- Production example for a dedicated application account.
-- Apply with an administrative account, then configure DB_USERNAME/DB_PASSWORD
-- to use the created mycard_app credential.

CREATE USER IF NOT EXISTS 'mycard_app'@'%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

GRANT SELECT, INSERT, UPDATE, DELETE ON mycard.* TO 'mycard_app'@'%';

-- If schema migration is performed by a separate deploy step, keep the app user
-- limited to DML only and run Flyway with an admin/migration account instead.
FLUSH PRIVILEGES;
