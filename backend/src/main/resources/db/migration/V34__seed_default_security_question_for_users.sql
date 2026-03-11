-- V34__seed_default_security_question_for_users.sql
-- Assign a default security question and answer to existing users

UPDATE users
SET security_question = '내가 다녔던 초등학교 이름은?',
    security_answer = '새싹초등학교'
WHERE security_question IS NULL;
