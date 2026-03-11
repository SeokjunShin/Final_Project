CREATE TABLE IF NOT EXISTS boards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO boards (title, content, author_name) VALUES 
('환영합니다!', '새로운 자유게시판입니다. 자유롭게 글을 남겨주세요.', '관리자'),
('질문있습니다', '카드 발급은 얼마나 걸리나요?', '궁금한유저');
