# Evidence Runbook

## 1) 로그 중앙 수집 (VM3)

Option B(간단): VM3에서 WEB/WAS 로그를 rsync pull

```bash
WEB_HOST=10.0.0.11 WAS_HOST=10.0.0.12 SSH_USER=mycard ./scripts/logging/vm3_pull_logs.sh
```

수집 경로 기본값:

- `/var/log/mycard/central/web/*`
- `/var/log/mycard/central/was/*`

## 2) 증적 패키지 생성

```bash
CASE_ID=CASE-001 FROM=2026-03-01 TO=2026-03-31 DB_USER=mycard_app DB_PASS='***' ./scripts/evidence/export_evidence.sh
```

결과:

- `./evidence_out/CASE-001.tar.gz`

포함 항목:

- Nginx access/error 로그
- WAS 애플리케이션 로그
- DB CSV: `login_attempts`, `audit_logs`, `inquiries`

## 3) 운영 주의

- 토큰 원문/비밀번호는 수집 대상에서 제외
- DB CSV는 보고 목적 최소 컬럼만 추출
- 보관 주기와 파기 정책은 운영팀 규정에 따름
