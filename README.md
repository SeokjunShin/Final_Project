# MyCard - 카드사 포털 시스템

> 3-Tier 아키텍처(WEB/WAS/DB) 기반 카드사 고객 포털 및 관리자 포털

## 📋 목차

- [프로젝트 개요](#프로젝트-개요)
- [시스템 아키텍처](#시스템-아키텍처)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [설치 및 실행](#설치-및-실행)
- [배포 가이드](#배포-가이드)
- [API 문서](#api-문서)
- [보안](#보안)
- [라이선스](#라이선스)

---

## 프로젝트 개요

MyCard는 카드사 고객을 위한 종합 포털 시스템입니다. 사용자는 카드 이용내역 조회, 청구서 확인, 포인트 관리, 고객문의 등의 기능을 이용할 수 있으며, 관리자는 사용자 관리, 가맹점 관리, 이벤트 관리 등을 수행할 수 있습니다.

### 주요 기능

**👤 사용자 포털 (mycard.local)**
- 대시보드: 카드 요약, 최근 결제, 포인트 현황
- 카드 관리: 카드 목록, 결제 내역, 카드 상태 변경
- 청구서: 월별 청구서 조회, 상세 내역 확인
- 포인트: 포인트 조회, 적립/사용 내역, 캐시백 전환
- 고객센터: 1:1 문의, 문서 제출, 공지사항
- 이벤트: 진행 중 이벤트 참여

**🔧 관리자 포털 (admin.mycard.local)**
- 사용자 관리: 회원 조회, 계정 상태 변경
- 가맹점 관리: 가맹점 조회, 상태 관리
- 포인트 정책: 적립률, 전환 수수료 설정
- 감사 로그: 시스템 활동 기록 조회

---

## 시스템 아키텍처

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Nginx     │────▶│ Spring Boot │────▶│   MySQL     │
│  (Browser)  │     │   (WEB)     │     │   (WAS)     │     │   (DB)      │
│             │     │   :80       │     │   :8080     │     │   :3306     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
    ┌──────────────┐          ┌──────────────┐
    │ User Portal  │          │ Admin Portal │
    │ mycard.local │          │ admin.mycard │
    └──────────────┘          └──────────────┘
```

---

## 기술 스택

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| Java | 17 | 런타임 |
| Spring Boot | 3.2.2 | 애플리케이션 프레임워크 |
| Spring Security | 6.x | 인증/인가 |
| Spring Data JPA | 3.x | ORM |
| Flyway | 9.x | DB 마이그레이션 |
| jjwt | 0.12.3 | JWT 처리 |
| MySQL | 8.0 | 데이터베이스 |

### Frontend (계획)
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18 | UI 프레임워크 |
| TypeScript | 5.x | 타입 안전성 |
| Vite | 5.x | 빌드 도구 |
| TailwindCSS | 3.x | 스타일링 |
| React Router | 6.x | 라우팅 |

### Infrastructure
| 기술 | 용도 |
|------|------|
| Nginx | 리버스 프록시, 정적 파일 서빙 |
| systemd | 서비스 관리 |
| Ubuntu 22.04 | 운영 서버 OS |

---

## 프로젝트 구조

```
Final_project/
├── backend/                          # Spring Boot 백엔드
│   ├── src/main/java/com/mycard/api/
│   │   ├── config/                   # 설정 클래스
│   │   ├── controller/               # REST 컨트롤러
│   │   ├── dto/                      # 데이터 전송 객체
│   │   ├── entity/                   # JPA 엔티티
│   │   ├── exception/                # 예외 처리
│   │   ├── repository/               # 데이터 액세스
│   │   ├── security/                 # 보안 (JWT)
│   │   └── service/                  # 비즈니스 로직
│   └── src/main/resources/
│       ├── application.yml           # 애플리케이션 설정
│       ├── logback-spring.xml        # 로깅 설정
│       └── db/migration/             # Flyway 마이그레이션
│
├── frontend-user/                    # 사용자 포털 (React)
├── frontend-admin/                   # 관리자 포털 (React)
│
├── infra/                            # 인프라 설정
│   ├── nginx/                        # Nginx 설정
│   ├── systemd/                      # systemd 서비스
│   └── env/                          # 환경 변수
│
└── scripts/                          # 배포 스크립트
    ├── build_all.sh                  # 전체 빌드
    ├── deploy_api.sh                 # API 배포
    └── deploy_web.sh                 # 프론트엔드 배포
```

---

## 설치 및 실행

### 사전 요구사항

- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Git

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/mycard.git
cd mycard
```

### 2. 데이터베이스 설정

```sql
-- MySQL에서 실행
CREATE DATABASE mycard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mycard_app'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON mycard.* TO 'mycard_app'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 환경 변수 설정

```bash
# 개발 환경에서는 application.yml 직접 수정 또는 환경 변수 설정
export SPRING_DATASOURCE_PASSWORD=your_secure_password
export JWT_SECRET=$(openssl rand -base64 64)
```

### 4. 백엔드 실행 (개발 모드)

```bash
cd backend

# Gradle Wrapper 실행 권한 부여 (Linux/Mac)
chmod +x gradlew

# 빌드 및 실행
./gradlew bootRun
```

API 서버가 `http://localhost:8080`에서 실행됩니다.

### 5. API 문서 확인

브라우저에서 `http://localhost:8080/api/swagger-ui.html` 접속

---

## 배포 가이드

### Ubuntu 서버 준비

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# JDK 17 설치
sudo apt install openjdk-17-jdk -y

# Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Nginx 설치
sudo apt install nginx -y

# MySQL 8 설치
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

### 데이터베이스 설정

```bash
sudo mysql
```

```sql
CREATE DATABASE mycard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mycard_app'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON mycard.* TO 'mycard_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 사용자 생성 및 디렉토리 설정

```bash
# mycard 서비스 사용자 생성
sudo useradd -r -s /bin/false mycard

# 디렉토리 생성
sudo mkdir -p /opt/mycard/api
sudo mkdir -p /var/www/mycard/{user,admin}
sudo mkdir -p /var/lib/mycard/uploads
sudo mkdir -p /var/log/mycard
sudo mkdir -p /etc/mycard

# 권한 설정
sudo chown -R mycard:mycard /opt/mycard
sudo chown -R mycard:mycard /var/lib/mycard
sudo chown -R mycard:mycard /var/log/mycard
sudo chown -R www-data:www-data /var/www/mycard
```

### 환경 설정 파일 배포

```bash
# 환경 변수 파일 복사 및 수정
sudo cp infra/env/mycard-api.env.example /etc/mycard/mycard-api.env
sudo chmod 600 /etc/mycard/mycard-api.env
sudo nano /etc/mycard/mycard-api.env  # 실제 값으로 수정
```

### Nginx 설정

```bash
# Nginx 설정 복사
sudo cp infra/nginx/mycard.conf /etc/nginx/sites-available/
sudo cp infra/nginx/admin.conf /etc/nginx/sites-available/

# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/mycard.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.conf /etc/nginx/sites-enabled/

# Nginx 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx
```

### systemd 서비스 설정

```bash
# 서비스 파일 복사
sudo cp infra/systemd/mycard-api.service /etc/systemd/system/

# 서비스 등록 및 시작
sudo systemctl daemon-reload
sudo systemctl enable mycard-api
sudo systemctl start mycard-api

# 상태 확인
sudo systemctl status mycard-api
```

### hosts 파일 설정 (로컬 테스트용)

```bash
# /etc/hosts 파일에 추가
echo "127.0.0.1 mycard.local admin.mycard.local" | sudo tee -a /etc/hosts
```

### 빌드 및 배포 스크립트 사용

```bash
# 전체 빌드
./scripts/build_all.sh

# API 배포
./scripts/deploy_api.sh

# 프론트엔드 배포
./scripts/deploy_web.sh
```

---

## API 문서

### 인증 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/auth/login | 로그인 |
| POST | /api/auth/logout | 로그아웃 |
| POST | /api/auth/refresh | 토큰 갱신 |

### 대시보드 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/dashboard/summary | 대시보드 요약 정보 |

### 카드 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/cards | 내 카드 목록 |
| GET | /api/cards/{id} | 카드 상세 |
| GET | /api/cards/{id}/approvals | 카드 결제 내역 |
| PATCH | /api/cards/{id}/status | 카드 상태 변경 |

### 포인트 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/points/balance | 포인트 잔액 |
| GET | /api/points/ledger | 포인트 내역 |
| POST | /api/points/convert | 포인트 전환 (캐시백) |

### 문의 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/inquiries | 문의 목록 |
| POST | /api/inquiries | 문의 등록 |
| GET | /api/inquiries/{id} | 문의 상세 |

자세한 API 문서는 Swagger UI에서 확인할 수 있습니다:
- 로컬: `http://localhost:8080/api/swagger-ui.html`
- 배포: `http://mycard.local/api/swagger-ui.html`

---

## 보안

### 인증 방식

- **JWT (JSON Web Token)** 기반 인증
- Access Token: 15분 유효
- Refresh Token: 7일 유효, DB에 해시 저장

### 비밀번호 보안

- bcrypt 알고리즘으로 해싱 (cost factor 10)
- 로그인 5회 실패 시 계정 잠금

### API 보안

- HTTPS 사용 권장 (프로덕션)
- CORS 설정으로 허용된 출처만 접근
- Rate Limiting 적용 권장

### 역할 기반 접근 제어 (RBAC)

| 역할 | 설명 | 권한 |
|------|------|------|
| ROLE_USER | 일반 사용자 | 자신의 데이터 조회/관리 |
| ROLE_OPERATOR | 운영자 | 사용자 조회, 문의 답변, 감사 로그 조회 |
| ROLE_ADMIN | 관리자 | 모든 기능 접근 가능 |

---

## 테스트 계정 (개발용)

| 사용자 | 비밀번호 | 역할 |
|--------|----------|------|
| user1 | password123 | USER |
| user2 | password123 | USER |
| operator1 | password123 | OPERATOR |
| admin | password123 | ADMIN |

---

## 트러블슈팅

### 서비스 시작 실패

```bash
# 로그 확인
sudo journalctl -u mycard-api -f

# 환경 변수 확인
sudo cat /etc/mycard/mycard-api.env
```

### DB 연결 실패

```bash
# MySQL 상태 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u mycard_app -p -h localhost mycard
```

### Nginx 502 에러

```bash
# API 서버 상태 확인
curl http://localhost:8080/api/health

# Nginx 에러 로그 확인
sudo tail -f /var/log/nginx/mycard_error.log
```

---

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 기여

버그 리포트, 기능 제안, PR은 언제든 환영합니다!

1. 이슈를 먼저 등록해주세요
2. Fork 후 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

---

## Frontend Deployment (No Docker)

- User portal project: `frontend-user`
- Admin portal project: `frontend-admin`
- Build outputs are generated at each project `dist/` and must **not** be committed.

### Build

```bash
cd frontend-user && npm run build
cd ../frontend-admin && npm run build
```

### Linux WEB VM Nginx static directories

- User portal (`mycard.local`): `/var/www/mycard/user`
- Admin portal (`admin.mycard.local`): `/var/www/mycard/admin`

### Example deploy

```bash
sudo rsync -av --delete frontend-user/dist/ /var/www/mycard/user/
sudo rsync -av --delete frontend-admin/dist/ /var/www/mycard/admin/
```

- API calls use `/api` path and are reverse-proxied by Nginx to Spring Boot WAS.
- Frontend builds run with no base path.
