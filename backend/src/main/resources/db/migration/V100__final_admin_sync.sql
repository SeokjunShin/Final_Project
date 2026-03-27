-- [V100] 관리자 및 운영자 계정 2차 비밀번호 일괄 강제 동기화 (최종 확정본)
-- 권한(Role) 기반으로 MASTER_ADMIN, REVIEW_ADMIN, OPERATOR 권한을 가진 모든 계정을 동기화합니다.

UPDATE users 
SET secondary_password = '$2a$10$/J3GJ6b8HrPoB42hDe4I9OGXzGDedjahgVaSfEu8fUBTuxS0M/lF6'
WHERE id IN (
    SELECT ur.user_id 
    FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE r.name IN ('MASTER_ADMIN', 'REVIEW_ADMIN', 'OPERATOR')
);
