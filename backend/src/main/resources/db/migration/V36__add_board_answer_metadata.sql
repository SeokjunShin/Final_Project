SET @add_answer_author_name = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'boards'
              AND column_name = 'answer_author_name'
        ),
        'SELECT 1',
        'ALTER TABLE boards ADD COLUMN answer_author_name VARCHAR(100) DEFAULT NULL'
    )
);
PREPARE stmt FROM @add_answer_author_name;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_answer_updated_at = (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'boards'
              AND column_name = 'answer_updated_at'
        ),
        'SELECT 1',
        'ALTER TABLE boards ADD COLUMN answer_updated_at TIMESTAMP NULL DEFAULT NULL'
    )
);
PREPARE stmt FROM @add_answer_updated_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE boards
SET answer_author_name = '관리자',
    answer_updated_at = updated_at
WHERE answer IS NOT NULL
  AND TRIM(answer) <> ''
  AND answer_author_name IS NULL;
