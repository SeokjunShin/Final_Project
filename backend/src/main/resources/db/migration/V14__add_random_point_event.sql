-- V14__add_random_point_event.sql

-- 기존 더미 이벤트 삭제 (이미 V2가 실행된 DB 대응)
DELETE FROM event_entries WHERE event_id = 99011;
DELETE FROM events WHERE id = 99011;

-- 새 랜덤 포인트 이벤트 추가
INSERT INTO events (id, title, content, start_at, end_at, status, created_by, image_url, created_at, updated_at) VALUES 
(20000, 
'[오픈 기념] 100% 당첨! 매일매일 랜덤 포인트 뽑기', 
'MyCard 오픈을 기념하여 매일 100% 당첨되는 랜덤 포인트 뽑기 이벤트를 진행합니다!<br/><br/>하루에 한 번 참여하고 최소 100P에서 최대 50,000P까지 행운의 주인공이 되어보세요.<br/>매일 새로운 기회가 찾아옵니다!<br/><br/>* 지급된 포인트는 즉시 사용 가능합니다.<br/>* 부정 참여 시 포인트가 회수될 수 있습니다.', 
'2026-01-01 00:00:00', 
'2026-12-31 23:59:59', 
'ACTIVE', 
201, 
'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80', 
NOW(), 
NOW());
