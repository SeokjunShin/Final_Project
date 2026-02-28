# MyCard - 카드 관리 시스템

MyCard는 카드 발급, 관리, 포인트 시스템을 제공하는 웹 애플리케이션입니다.

## 기술 스택

### Backend
- **Java 21** + **Spring Boot 3.2.2**
- **Spring Security** + **JWT** 인증
- **JPA/Hibernate** + **MySQL 8.0**
- **Flyway** (DB 마이그레이션)

### Frontend
- **React 18** + **TypeScript**
- **Vite 5** (빌드 도구)
- **Material UI (MUI)** (UI 컴포넌트)
- **React Query** (서버 상태 관리)
- **React Hook Form** + **Zod** (폼 검증)

### Infrastructure
- **Ubuntu 24.04** (VMware 3-Tier Architecture)
- **MySQL 8.0** (DB Server)
- **Nginx** (리버스 프록시)

---

## 시스템 아키텍처

### 3-Tier Architecture (운영 환경)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   MyCard 시스템 아키텍처                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│    ┌─────────────┐                                                                           │
│    │   CLIENT    │                                                                           │
│    │  (Browser)  │                                                                           │
│    └──────┬──────┘                                                                           │
│           │                                                                                  │
│           │ HTTP                                                                             │
│           ▼                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════════════════════ │
│  │                              PUBLIC ZONE (DMZ)                                          │ │
│  │                                                                                         │ │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    WEB SERVER - 192.168.10.137                                     │ │ │
│  │  │                    OS: Windows Server 2016                                         │ │ │
│  │  │                    WEB: Nginx                                                      │ │ │
│  │  │                                                                                    │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │ │ │
│  │  │  │                      USER PORTAL                                            │  │ │ │
│  │  │  │                      Port: 80 (외부 공개)                                    │  │ │ │
│  │  │  │                                                                             │  │ │ │
│  │  │  │  • /        → Static Files (frontend-user)                                  │  │ │ │
│  │  │  │  • /api/*   → Proxy Pass ─────────────────────────────────────────────┐     │  │ │ │
│  │  │  └─────────────────────────────────────────────────────────────────────────────┘  │ │ │
│  │  └────────────────────────────────────────────────────────────────────────────────────┘ │ │
│  ═══════════════════════════════════════════════════════════════════════════════════════════ │
│                                                                        │                     │
│                                                                        │ HTTP (:8080)       │
│                                                                        ▼                     │
│  ═══════════════════════════════════════════════════════════════════════════════════════════ │
│  │                              PRIVATE ZONE                                               │ │
│  │                                                                                         │ │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    ADMIN WEB - 192.168.10.137:8081                                 │ │ │
│  │  │                    OS: Windows Server 2016 | WEB: Nginx                            │ │ │
│  │  │                    ┌─────────────────────────────────────────────────────────┐     │ │ │
│  │  │                    │ ⛔ 접근 제어: 내부 IP만 허용 (192.168.10.0/24)           │     │ │ │
│  │  │                    │    allow 192.168.10.0/24;                                │     │ │ │
│  │  │                    │    deny all;                                             │     │ │ │
│  │  │                    └─────────────────────────────────────────────────────────┘     │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │ │ │
│  │  │  │                      ADMIN PORTAL                                           │  │ │ │
│  │  │  │                      Port: 8081 (내부 전용)                                  │  │ │ │
│  │  │  │                                                                             │  │ │ │
│  │  │  │  • /        → Static Files (frontend-admin)                                 │  │ │ │
│  │  │  │  • /api/*   → Proxy Pass ─────────────────────────────────────────────┐     │  │ │ │
│  │  │  └─────────────────────────────────────────────────────────────────────────────┘  │ │ │
│  │  └────────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                     │                   │ │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    WAS SERVER - 192.168.10.134                  ◀┘                 │ │ │
│  │  │                    OS: Ubuntu 24.04.4 LTS                                          │ │ │
│  │  │                                                                                    │ │ │
│  │  │  ┌──────────────────────────────────────────────────────────────────────────────┐ │ │ │
│  │  │  │                    Spring Boot Application                                   │ │ │ │
│  │  │  │                         Port: 8080                                           │ │ │ │
│  │  │  │  ┌────────────────────────────────────────────────────────────────────────┐ │ │ │ │
│  │  │  │  │                 Embedded Tomcat 10.1.18                                │ │ │ │ │
│  │  │  │  │  ┌────────────────────────────────────────────────────────────────┐   │ │ │ │ │
│  │  │  │  │  │                    Java 21 Runtime                             │   │ │ │ │ │
│  │  │  │  │  │                                                                │   │ │ │ │ │
│  │  │  │  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │   │ │ │ │ │
│  │  │  │  │  │  │ Controller │→ │  Service   │→ │ Repository │  │ Security │ │   │ │ │ │ │
│  │  │  │  │  │  │  (REST)    │  │ (Business) │  │   (JPA)    │  │  (JWT)   │ │   │ │ │ │ │
│  │  │  │  │  │  └────────────┘  └────────────┘  └─────┬──────┘  └──────────┘ │   │ │ │ │ │
│  │  │  │  │  └────────────────────────────────────────┼───────────────────────┘   │ │ │ │ │
│  │  │  │  └───────────────────────────────────────────┼────────────────────────────┘ │ │ │ │
│  │  │  └──────────────────────────────────────────────┼──────────────────────────────┘ │ │ │
│  │  └─────────────────────────────────────────────────┼────────────────────────────────┘ │ │
│  │                                                    │                                  │ │
│  │                                                    │ JDBC (:3306)                    │ │
│  │                                                    ▼                                  │ │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    DB SERVER - 192.168.10.135                                      │ │ │
│  │  │                    OS: Ubuntu 24.04.4 LTS                                          │ │ │
│  │  │                                                                                    │ │ │
│  │  │  ┌──────────────────────────────────────────────────────────────────────────────┐ │ │ │
│  │  │  │                         MySQL 8.0                                            │ │ │ │
│  │  │  │                         Port: 3306                                           │ │ │ │
│  │  │  │                                                                              │ │ │ │
│  │  │  │   Database: mycard                                                           │ │ │ │
│  │  │  │   ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐              │ │ │ │
│  │  │  │   │ users  │ │ cards  │ │ loans  │ │approvals │ │ statements │              │ │ │ │
│  │  │  │   └────────┘ └────────┘ └────────┘ └──────────┘ └────────────┘              │ │ │ │
│  │  │  │   ┌──────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐                │ │ │ │
│  │  │  │   │inquiries │ │ audit_logs │ │point_ledger│ │refresh_token│                │ │ │ │
│  │  │  │   └──────────┘ └────────────┘ └────────────┘ └─────────────┘                │ │ │ │
│  │  │  └──────────────────────────────────────────────────────────────────────────────┘ │ │ │
│  │  └────────────────────────────────────────────────────────────────────────────────────┘ │ │
│  ═══════════════════════════════════════════════════════════════════════════════════════════ │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 서버 구성 상세

| 구분 | Zone | IP | Port | OS | 기술 스택 | 접근 제어 |
|------|------|-----|------|-----|-----------|-----------|
| WEB | PUBLIC | 192.168.10.137 | 80 | Windows Server 2016 | Nginx + React (User) | 외부 허용 |
| WEB | **PRIVATE** | 192.168.10.137 | 8081 | Windows Server 2016 | Nginx + React (Admin) | **내부 IP만** |
| WAS | PRIVATE | 192.168.10.134 | 8080 | Ubuntu 24.04.4 LTS | Spring Boot + Tomcat 10.1.18 | 내부만 |
| DB | PRIVATE | 192.168.10.135 | 3306 | Ubuntu 24.04.4 LTS | MySQL 8.0 | 내부만 |

### 접근 제어 정책

| Port | 서비스 | 허용 IP | 설명 |
|------|--------|---------|------|
| 80 | User Portal | 0.0.0.0/0 (ANY) | 외부 사용자 접근 허용 |
| 8081 | Admin Portal | 192.168.10.0/24 | **내부 네트워크만 허용** |
| 8080 | REST API | 192.168.10.137 | WEB 서버에서만 접근 |
| 3306 | MySQL | 192.168.10.134 | WAS 서버에서만 접근 |

### 통신 흐름

```
[External User]                      [Internal Admin]
       │                                    │
       │ HTTP (:80)                         │ HTTP (:8081) - 내부망만
       ▼                                    ▼
┌─────────────────────────────────────────────────────────┐
│              Nginx - 192.168.10.137                     │
│  ┌─────────────────┐        ┌─────────────────┐        │
│  │  User Portal    │        │  Admin Portal   │        │
│  │  Port: 80       │        │  Port: 8081     │        │
│  │  (PUBLIC)       │        │  (PRIVATE)      │        │
│  └────────┬────────┘        └────────┬────────┘        │
└───────────┼──────────────────────────┼──────────────────┘
            │         Proxy Pass       │
            └────────────┬─────────────┘
                         ▼
          ┌─────────────────────────────┐
          │  Spring Boot + Tomcat       │
          │  192.168.10.134:8080        │
          │  (PRIVATE)                  │
          └──────────────┬──────────────┘
                         │ JDBC
                         ▼
          ┌─────────────────────────────┐
          │  MySQL 8.0                  │
          │  192.168.10.135:3306        │
          │  (PRIVATE)                  │
          └─────────────────────────────┘
```

### 접속 정보

| 포털 | URL | 접근 |
|------|-----|------|
| 사용자 포털 | http://192.168.10.137 | 외부 허용 |
| 관리자 포털 | http://192.168.10.137:8081 | **내부 IP (192.168.10.x)에서만** |

---

## 프로젝트 구조

```
Final_project/
├── backend/                 # Spring Boot API 서버
│   ├── src/main/java/com/mycard/api/
│   │   ├── controller/      # REST API 컨트롤러
│   │   ├── service/         # 비즈니스 로직
│   │   ├── entity/          # JPA 엔티티
│   │   ├── dto/             # 데이터 전송 객체
│   │   ├── repository/      # JPA 레포지토리
│   │   ├── security/        # JWT, Spring Security
│   │   └── config/          # 설정 클래스
│   └── src/main/resources/
│       ├── application.yml  # 애플리케이션 설정
│       └── db/migration/    # Flyway 마이그레이션
├── frontend-user/           # 사용자 포털 (React)
├── frontend-admin/          # 관리자 포털 (React)
├── infra/                   # Nginx, systemd 설정
└── scripts/                 # 배포 스크립트
    ├── setup_db_server.sh       # DB 서버 설정
    ├── setup_backend_server.sh  # 백엔드 서버 설정
    └── setup_frontend_server.sh # 프론트엔드 서버 설정
```

---

## 로컬 개발 환경 실행

### 1. 사전 요구사항
- Java 21
- Node.js 18+
- Docker Desktop (로컬 개발용 MySQL)

### 2. MySQL 컨테이너 실행 (로컬 개발용)
```bash
docker compose up -d
```
또는
```bash
docker run -d --name mycard-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=mycard \
  -e MYSQL_USER=mycard \
  -e MYSQL_PASSWORD=mycard_password \
  -p 3306:3306 \
  mysql:8.0
```

### 3. Backend 실행
```bash
cd backend
./gradlew bootRun
```
- API: http://localhost:8080/api

### 4. Frontend 실행
```bash
# 사용자 포털
cd frontend-user
npm install
npm run dev
# -> http://localhost:5173

# 관리자 포털
cd frontend-admin
npm install
npm run dev
# -> http://localhost:5174
```

---

## VMware Ubuntu 24.04 서버 배포 (3-Tier)

### 서버 구성
| 서버 | 역할 | IP | Port | 설치 항목 |
|------|------|-----|------|-----------|
| VM1 | Frontend (WEB) | 192.168.10.137 | 80, 8081 | Nginx, Node.js |
| VM2 | Backend (WAS) | 192.168.10.134 | 8080 | Java 21, Spring Boot (Tomcat 10.1.18) |
| VM3 | Database (DB) | 192.168.10.135 | 3306 | MySQL 8.0 |

### Step 1: DB 서버 설정 (VM3 - 192.168.10.135)

```bash
# 1. 스크립트 복사
scp scripts/setup_db_server.sh user@192.168.10.135:/tmp/

# 2. DB 서버에서 실행 (백엔드 서버 IP를 인자로 전달)
ssh user@192.168.10.135
sudo bash /tmp/setup_db_server.sh "192.168.10.134"
```

**출력 예시:**
```
MySQL 정보:
  - Host: 192.168.10.135
  - Port: 3306
  - Database: mycard
  - User: mycard
  - Password: mycard_password
```

### Step 2: Backend 서버 설정 (VM2 - 192.168.10.134)

```bash
# 1. 스크립트 복사
scp scripts/setup_backend_server.sh user@192.168.10.134:/tmp/

# 2. 백엔드 서버에서 실행 (DB 서버 정보 전달)
ssh user@192.168.10.134
sudo bash /tmp/setup_backend_server.sh "192.168.10.135" "3306" "mycard" "mycard" "mycard_password"

# 3. 백엔드 소스 복사
scp -r backend/* user@192.168.10.134:/opt/mycard/backend/

# 4. 권한 설정 및 서비스 시작
ssh user@192.168.10.134
sudo chmod +x /opt/mycard/backend/gradlew
sudo chown -R mycard:mycard /opt/mycard/backend
sudo systemctl start mycard-backend
sudo systemctl enable mycard-backend
```

### 수동 실행 (디버깅용)
```bash
cd ~/Final_Project/backend
CORS_ALLOWED_ORIGINS="http://192.168.10.137,http://192.168.10.137:8081" \
DB_URL="jdbc:mysql://192.168.10.135:3306/mycard?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul" \
DB_USERNAME=mycard \
DB_PASSWORD=mycard_password \
./gradlew bootRun
```

### Step 3: Frontend 서버 설정 (VM1 - 192.168.10.137)

```bash
# 1. 스크립트 복사
scp scripts/setup_frontend_server.sh user@192.168.10.137:/tmp/

# 2. 프론트엔드 서버에서 실행 (백엔드 서버 정보 전달)
ssh user@192.168.10.137
sudo bash /tmp/setup_frontend_server.sh "192.168.10.134" "8080" "mycard.local" "admin.mycard.local"

# 3. 프론트엔드 소스 복사 및 빌드 (사용자 포털)
scp -r frontend-user/* user@192.168.10.137:/opt/mycard/frontend-user/
ssh user@192.168.10.137
cd /opt/mycard/frontend-user
sudo -u mycard npm install
sudo -u mycard npm run build

# 4. 프론트엔드 소스 복사 및 빌드 (관리자 포털)
scp -r frontend-admin/* user@192.168.10.137:/opt/mycard/frontend-admin/
ssh user@192.168.10.137
cd /opt/mycard/frontend-admin
sudo -u mycard npm install
sudo -u mycard npm run build

# 5. Nginx 재시작
sudo systemctl restart nginx
```

### Step 4: 클라이언트 hosts 파일 설정 (선택사항)

도메인 사용 시 Windows 관리자 권한 메모장으로 수정:
```
C:\Windows\System32\drivers\etc\hosts
```

**추가할 내용:**
```
192.168.10.137 mycard.local admin.mycard.local
```

### Step 5: 접속 확인

| 포털 | IP 접속 | 도메인 접속 |
|------|---------|-------------|
| 사용자 포털 | http://192.168.10.137 | http://mycard.local |
| 관리자 포털 | http://192.168.10.137:8081 | http://admin.mycard.local |

---

## 서비스 관리 명령어

### Backend (VM2)
```bash
sudo systemctl start mycard-backend    # 시작
sudo systemctl stop mycard-backend     # 중지
sudo systemctl restart mycard-backend  # 재시작
sudo systemctl status mycard-backend   # 상태 확인
sudo journalctl -u mycard-backend -f   # 로그 확인
```

### Frontend (VM1)
```bash
sudo systemctl restart nginx           # Nginx 재시작
sudo nginx -t                          # 설정 검사
sudo tail -f /var/log/nginx/error.log  # 에러 로그
```

### Database (VM3)
```bash
sudo systemctl status mysql            # MySQL 상태
sudo mysql -u mycard -p mycard         # DB 접속
```

---

## 인증 시스템 (JWT)

### 설정값 (application.yml)
```yaml
app:
  jwt:
    secret: (환경변수)
    access-token-validity-ms: 900000      # 15분
    refresh-token-validity-ms: 604800000  # 7일
```

### 토큰 흐름
1. **로그인** -> Access Token + Refresh Token 발급
2. **API 요청** -> Authorization: Bearer <access_token> 헤더
3. **Access Token 만료** -> Refresh Token으로 자동 갱신
4. **Refresh Token 만료** -> 재로그인 필요

---

## 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 사용자 | user1@mycard.local | MyCard!234 |
| 관리자 | admin@mycard.local | MyCard!234 |

---

## 주요 기능

### 사용자 포털 (frontend-user)
- **카드 관리**: 카드 조회, 해외결제 설정, 재발급 신청
- **카드 신청**: 개인정보 -> 직업/소득 -> 카드 선택 -> 비밀번호 설정
- **이용내역**: 월별 명세서, 승인 내역 조회
- **포인트**: 잔액 조회, 현금 전환, 출금 계좌 관리
- **대출**: 대출 신청, 내역 조회
- **고객지원**: 문의하기, 문서 제출

### 관리자 포털 (frontend-admin)
- **사용자 관리**: 회원 조회, 상태 변경
- **카드 신청 심사**: 승인/거절 처리
- **대출 관리**: 대출 심사, 실행
- **문의 관리**: 고객 문의 답변
- **감사 로그**: 시스템 활동 기록 조회
- **시스템 메시지**: 전체 공지 발송

---

## 보안 취약점 진단용 설정 (개발/테스트 전용)

> **주의**: 아래 설정은 취약점 진단 목적으로만 사용됩니다. 운영 환경에서는 절대 사용하지 마세요.

### 1. 카드번호/계좌번호 마스킹 해제
- 프론트엔드에서 실제 카드번호, 계좌번호가 그대로 노출됨
- 관련 파일: CardsPage.tsx, PointsPage.tsx, DashboardPage.tsx

### 2. 카드 비밀번호 평문 저장
- 카드 신청 시 입력한 비밀번호가 DB에 평문으로 저장됨
- DB 컬럼: cards.card_password, card_applications.card_password
- 마이그레이션: V6__card_password.sql

### 3. 비밀번호 조건 실시간 표시
- 회원가입 시 비밀번호 조건 충족 여부가 실시간으로 표시됨
- 파일: RegisterPage.tsx

---

## 데이터베이스 스키마

### 주요 테이블
| 테이블 | 설명 |
|--------|------|
| users | 사용자 정보 |
| cards | 발급된 카드 |
| card_applications | 카드 신청 내역 |
| approvals | 승인 내역 |
| statements | 명세서 |
| point_ledger | 포인트 내역 |
| user_bank_accounts | 출금 계좌 |
| loans | 대출 |
| inquiries | 고객 문의 |
| refresh_tokens | 리프레시 토큰 |
| audit_logs | 감사 로그 |

---

## 주요 API 엔드포인트

### 인증
- POST /api/auth/login - 로그인
- POST /api/auth/refresh - 토큰 갱신
- POST /api/auth/logout - 로그아웃
- GET /api/auth/me - 내 정보

### 사용자
- GET /api/cards - 카드 목록
- GET /api/dashboard/summary - 대시보드 요약
- GET /api/statements - 명세서 목록
- POST /api/card-applications - 카드 신청

### 관리자
- GET /api/admin/users - 사용자 목록
- GET /api/admin/card-applications - 신청 목록
- PATCH /api/admin/card-applications/{id}/review - 신청 심사
- GET /api/admin/audit-logs - 감사 로그

---

## 문서

- docs/FRONTEND_REFERENCE.md - 프론트엔드 참조
- docs/NO_DOCKER_RUNBOOK.md - 배포 가이드
- docs/P0_API_RBAC_MATRIX.md - API 권한 매트릭스
