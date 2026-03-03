-- V16__remove_future_point_data.sql

-- 미래 날짜로 되어 있는 포인트 지출 항목 삭제
DELETE FROM point_ledger WHERE id IN (7003, 7004, 7103);
-- 이와 연관된 포인트 전환내역 삭제
DELETE FROM point_withdrawals WHERE id IN (8001, 8002);

-- 소진되지 않은 상태로 잔액 원복
UPDATE point_balance SET balance = 12500 WHERE user_id = 1;
UPDATE point_balance SET balance = 9500 WHERE user_id = 2;
