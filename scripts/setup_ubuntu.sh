#!/bin/bash
# =====================================================
# MyCard - Ubuntu 24.04 Server Setup Script
# Docker 없이 직접 설치
# =====================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Check root
if [ "$EUID" -ne 0 ]; then
    log_error "이 스크립트는 root 권한이 필요합니다. sudo로 실행해주세요."
    exit 1
fi

PROJECT_DIR="/opt/mycard"
MYSQL_ROOT_PASSWORD="MyCard@Root123"
MYSQL_USER="mycard"
MYSQL_PASSWORD="mycard_password"
MYSQL_DATABASE="mycard"

echo ""
echo "=========================================="
echo "   MyCard Server Setup for Ubuntu 24.04"
echo "=========================================="
echo ""

# --------------------- 1. System Update ---------------------
log_step "1/8 시스템 업데이트 중..."
apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# --------------------- 2. Java 21 설치 ---------------------
log_step "2/8 Java 21 (OpenJDK) 설치 중..."
apt install -y openjdk-21-jdk

# JAVA_HOME 설정
echo 'export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64' >> /etc/profile.d/java.sh
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> /etc/profile.d/java.sh
source /etc/profile.d/java.sh

java -version
log_info "Java 21 설치 완료"

# --------------------- 3. Node.js 20 설치 ---------------------
log_step "3/8 Node.js 20 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node --version
npm --version
log_info "Node.js 20 설치 완료"

# --------------------- 4. MySQL 8.0 설치 ---------------------
log_step "4/8 MySQL 8.0 설치 중..."

# MySQL 설치 (비대화형)
export DEBIAN_FRONTEND=noninteractive
apt install -y mysql-server mysql-client

# MySQL 시작
systemctl start mysql
systemctl enable mysql

# MySQL 보안 설정 및 사용자 생성
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';"
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';"
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'localhost';"
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "FLUSH PRIVILEGES;"

log_info "MySQL 8.0 설치 및 데이터베이스 생성 완료"

# --------------------- 5. Nginx 설치 ---------------------
log_step "5/8 Nginx 설치 중..."
apt install -y nginx

systemctl start nginx
systemctl enable nginx

log_info "Nginx 설치 완료"

# --------------------- 6. 프로젝트 디렉토리 설정 ---------------------
log_step "6/8 프로젝트 디렉토리 설정 중..."

mkdir -p ${PROJECT_DIR}
mkdir -p ${PROJECT_DIR}/logs
mkdir -p ${PROJECT_DIR}/uploads

# mycard 사용자 생성 (없으면)
if ! id "mycard" &>/dev/null; then
    useradd -r -s /bin/false mycard
fi

log_info "프로젝트 디렉토리 생성 완료: ${PROJECT_DIR}"

# --------------------- 7. Nginx 설정 ---------------------
log_step "7/8 Nginx 설정 중..."

cat > /etc/nginx/sites-available/mycard << 'NGINX_CONF'
# MyCard - Nginx Configuration

# 프론트엔드 (사용자 포털)
server {
    listen 80;
    server_name mycard.local;

    root /opt/mycard/frontend-user/dist;
    index index.html;

    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 프록시
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SPA 라우팅
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# 관리자 포털
server {
    listen 80;
    server_name admin.mycard.local;

    root /opt/mycard/frontend-admin/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
NGINX_CONF

# 활성화
ln -sf /etc/nginx/sites-available/mycard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx 문법 검사 및 재시작
nginx -t
systemctl reload nginx

log_info "Nginx 설정 완료"

# --------------------- 8. Systemd 서비스 생성 ---------------------
log_step "8/8 Systemd 서비스 설정 중..."

cat > /etc/systemd/system/mycard-backend.service << 'SERVICE_CONF'
[Unit]
Description=MyCard Backend API Service
After=network.target mysql.service
Requires=mysql.service

[Service]
Type=simple
User=mycard
Group=mycard
WorkingDirectory=/opt/mycard/backend
Environment="JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64"
Environment="DB_URL=jdbc:mysql://localhost:3306/mycard?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul"
Environment="DB_USERNAME=mycard"
Environment="DB_PASSWORD=mycard_password"
Environment="JWT_SECRET=your-256-bit-secret-key-for-jwt-signing-must-be-at-least-32-chars-long"
ExecStart=/opt/mycard/backend/gradlew bootRun --no-daemon
Restart=on-failure
RestartSec=10
StandardOutput=append:/opt/mycard/logs/backend.log
StandardError=append:/opt/mycard/logs/backend-error.log

[Install]
WantedBy=multi-user.target
SERVICE_CONF

systemctl daemon-reload
log_info "Systemd 서비스 설정 완료"

# --------------------- 완료 ---------------------
echo ""
echo "=========================================="
echo "   설치 완료!"
echo "=========================================="
echo ""
log_info "설치된 소프트웨어:"
echo "  - Java 21 (OpenJDK)"
echo "  - Node.js $(node --version)"
echo "  - MySQL 8.0"
echo "  - Nginx"
echo ""
log_info "MySQL 정보:"
echo "  - Root 비밀번호: ${MYSQL_ROOT_PASSWORD}"
echo "  - Database: ${MYSQL_DATABASE}"
echo "  - User: ${MYSQL_USER}"
echo "  - Password: ${MYSQL_PASSWORD}"
echo ""
log_info "다음 단계:"
echo "  1. 프로젝트 파일을 ${PROJECT_DIR}로 복사"
echo "  2. 백엔드 빌드: cd ${PROJECT_DIR}/backend && ./gradlew build"
echo "  3. 프론트엔드 빌드: cd ${PROJECT_DIR}/frontend-user && npm install && npm run build"
echo "  4. 서비스 시작: systemctl start mycard-backend"
echo "  5. /etc/hosts에 도메인 추가 (테스트용):"
echo "     127.0.0.1 mycard.local admin.mycard.local"
echo ""
log_info "서비스 관리 명령어:"
echo "  systemctl start mycard-backend    # 시작"
echo "  systemctl stop mycard-backend     # 중지"
echo "  systemctl restart mycard-backend  # 재시작"
echo "  systemctl status mycard-backend   # 상태 확인"
echo "  journalctl -u mycard-backend -f   # 로그 확인"
echo ""
