-- 기존 관리자들 (MASTER_ADMIN, REVIEW_ADMIN, OPERATOR) 중 2차 비밀번호가 설정되지 않은 경우
-- 기본값 '123456'의 Spring Security BCrypt 해시값으로 일괄 업데이트합니다.
-- 해시값: $2a$10$8.UnVuG9HLROJOsI7wQxEce1M1X/bE4P9W5zL2rK8FqjDq.GqHj.u (123456)

UPDATE users 
SET secondary_password = '$2a$10$8.UnVuG9HLROJOsI7wQxEce1M1X/bE4P9W5zL2rK8FqjDq.GqHj.u'
WHERE secondary_password IS NULL
AND id IN (
    SELECT temp.user_id FROM (
        SELECT ur.user_id FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name IN ('MASTER_ADMIN', 'REVIEW_ADMIN', 'OPERATOR')
    ) AS temp
);
