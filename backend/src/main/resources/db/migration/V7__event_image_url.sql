-- V6__event_image_url.sql
-- events 테이블에 image_url 컬럼 추가

ALTER TABLE events ADD COLUMN image_url VARCHAR(500) NULL AFTER status;
