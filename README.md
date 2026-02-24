# MyCard Final Project

MyCard 카드사 포털의 수동 취약점 진단용 테스트베드입니다.

- `frontend-user`: 사용자 포털 (`mycard.local`)
- `frontend-admin`: 관리자/상담원 포털 (`admin.mycard.local`)
- `backend`: Spring Boot REST API (`/api`)
- `infra`: Nginx / systemd / env 템플릿
- `scripts`: Linux VM 빌드/배포 스크립트

## 1) 실행 구조 (Non-Docker)

- WEB: Nginx (80/443 외부 노출)
- WAS: Spring Boot (8080, 내부 통신)
- DB: MySQL (3306, 내부 통신)

외부 공개 포트는 80/443만 사용합니다.

## 2) 로컬 개발 실행

### Backend

```bash
cd backend
./gradlew bootRun
```

- API base path: `http://localhost:8080/api`

### Frontend User

```bash
cd frontend-user
npm install
npm run dev
```

### Frontend Admin

```bash
cd frontend-admin
npm install
npm run dev
```

## 3) Linux VM 배포 (No-Docker)

### 필수 디렉토리

```bash
sudo mkdir -p /opt/mycard/api
sudo mkdir -p /var/www/mycard/user
sudo mkdir -p /var/www/mycard/admin
sudo mkdir -p /var/lib/mycard/uploads
sudo mkdir -p /etc/mycard
sudo mkdir -p /var/log/mycard
```

### 백엔드 환경파일

`/etc/mycard/mycard-api.env` 생성 (샘플: `infra/env/mycard-api.env.example`)

필수 키:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `UPLOAD_PATH` (권장: `/var/lib/mycard/uploads`)

### 빌드

```bash
./scripts/build_all.sh
```

### 백엔드 배포

```bash
./scripts/deploy_api.sh
```

### 프론트 배포

```bash
./scripts/deploy_web.sh
```

프론트 산출물은 각 프로젝트 `dist/`이며 Git에 커밋하지 않습니다.

- 사용자 포털 dist 배포 경로: `/var/www/mycard/user`
- 관리자 포털 dist 배포 경로: `/var/www/mycard/admin`

## 4) Nginx / systemd 템플릿

- Nginx user vhost: `infra/nginx/mycard.conf`
- Nginx admin vhost: `infra/nginx/admin.conf`
- systemd: `infra/systemd/mycard-api.service`

`/api` 요청은 reverse proxy로 WAS(8080)로 전달됩니다.

## 5) P0 핵심 API

- 인증: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`
- 대시보드: `/api/dashboard/summary`
- 명세서: `/api/statements`, `/api/statements/{id}`, `/api/statements/{id}/export.csv`
- 문의(사용자): `/api/inquiries`, `/api/inquiries/{id}`, `/api/inquiries/{id}/replies`
- 문의(운영자): `/api/operator/inquiries`, `/api/operator/inquiries/{id}/assign`, `/api/operator/inquiries/{id}/resolve`

## 6) 문서

- 레퍼런스 매핑: `docs/FRONTEND_REFERENCE.md`
- No-Docker 실행/배포 가이드: `docs/NO_DOCKER_RUNBOOK.md`
- P0 API 권한 매트릭스: `docs/P0_API_RBAC_MATRIX.md`
- P0 갭 체크리스트: `docs/P0_GAP_CHECKLIST.md`