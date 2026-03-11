ALTER TABLE boards ADD COLUMN answer_author_name VARCHAR(100) DEFAULT NULL;
ALTER TABLE boards ADD COLUMN answer_updated_at TIMESTAMP NULL DEFAULT NULL;

UPDATE boards
SET answer_author_name = '관리자',
    answer_updated_at = updated_at
WHERE answer IS NOT NULL
  AND TRIM(answer) <> ''
  AND answer_author_name IS NULL;
