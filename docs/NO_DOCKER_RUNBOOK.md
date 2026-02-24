# No-Docker 실행/배포 가이드

## 개요

이 프로젝트는 Docker 없이 Linux VM에 직접 설치/배포합니다.

- WEB: Nginx
- WAS: Spring Boot JAR + systemd
- DB: MySQL

## 네트워크 정책

- 외부 공개: 80/443
- 내부 전용: 8080(WAS), 3306(DB)

## 1. 사전 설치

```bash
sudo apt update
sudo apt install -y openjdk-17-jdk nginx mysql-server rsync git
```

## 2. 코드 배치

```bash
git clone https://github.com/SeokjunShin/Final_Project.git
cd Final_Project
```

## 3. 경로/계정 준비

```bash
sudo useradd -r -s /bin/false mycard || true
sudo mkdir -p /opt/mycard/api /var/www/mycard/user /var/www/mycard/admin /var/lib/mycard/uploads /etc/mycard /var/log/mycard
sudo chown -R mycard:mycard /opt/mycard /var/lib/mycard /var/log/mycard
sudo chown -R www-data:www-data /var/www/mycard
```

## 4. 환경파일 준비

```bash
sudo cp infra/env/mycard-api.env.example /etc/mycard/mycard-api.env
sudo chmod 600 /etc/mycard/mycard-api.env
sudo vi /etc/mycard/mycard-api.env
```

필수값: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `UPLOAD_PATH`

## 5. Nginx 설정

```bash
sudo cp infra/nginx/mycard.conf /etc/nginx/sites-available/
sudo cp infra/nginx/admin.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/mycard.conf /etc/nginx/sites-enabled/mycard.conf
sudo ln -sf /etc/nginx/sites-available/admin.conf /etc/nginx/sites-enabled/admin.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 6. systemd 등록

```bash
sudo cp infra/systemd/mycard-api.service /etc/systemd/system/mycard-api.service
sudo systemctl daemon-reload
sudo systemctl enable mycard-api
```

## 7. 빌드/배포

```bash
./scripts/build_all.sh
./scripts/deploy_api.sh
./scripts/deploy_web.sh
```

## 8. 검증

```bash
curl -i http://localhost:8080/api/health
curl -i http://mycard.local/api/health
curl -i http://admin.mycard.local/api/health
sudo systemctl status mycard-api
```

## 보안 운영 메모

- 업로드 저장 경로는 `/var/lib/mycard/uploads` 고정 운영
- 업로드 파일은 Nginx 정적으로 노출하지 않고 API 권한 검증 후 다운로드
- 스택트레이스/민감정보는 외부 응답에 노출하지 않음 (로그로만 관리)