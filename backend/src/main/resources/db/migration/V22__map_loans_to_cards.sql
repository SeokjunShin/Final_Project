-- 대출과 실제 카드 매핑 추가

ALTER TABLE loans
  ADD COLUMN card_id BIGINT UNSIGNED NULL AFTER user_id;

ALTER TABLE loans
  ADD CONSTRAINT fk_loans_card
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL;

CREATE INDEX idx_loans_card_status ON loans(card_id, status);

UPDATE loans l
JOIN (
  SELECT user_id, MIN(id) AS first_card_id
  FROM cards
  GROUP BY user_id
) c ON c.user_id = l.user_id
SET l.card_id = c.first_card_id
WHERE l.card_id IS NULL;
