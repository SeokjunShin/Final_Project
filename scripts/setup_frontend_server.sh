#!/bin/bash
# =====================================================
# MyCard - Frontend Server Setup Script
# Ubuntu 24.04 - Node.js + Nginx
# 3-Tier Architecture: Frontend Server
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

# =====================================================
# 설정값 (필요시 수정)
# =====================================================
PROJECT_DIR="/opt/mycard"

# 백엔드 서버 IP (setup_backend_server.sh 실행 후 해당 서버 IP)
BACKEND_HOST="${1:-192.168.1.102}"
BACKEND_PORT="${2:-8080}"

# 도메인 설정 (hosts 파일 또는 DNS 설정 필요)
USER_DOMAIN="${3:-mycard.local}"
ADMIN_DOMAIN="${4:-admin.mycard.local}"

echo ""
echo "=========================================="
echo "   MyCard Frontend Server Setup"
echo "   Ubuntu 24.04 - Node.js + Nginx"
echo "=========================================="
echo ""
echo "Backend Server: ${BACKEND_HOST}:${BACKEND_PORT}"
echo "User Domain: ${USER_DOMAIN}"
echo "Admin Domain: ${ADMIN_DOMAIN}"
echo ""

# --------------------- 1. System Update ---------------------
log_step "1/6 시스템 업데이트 중..."
apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common

# --------------------- 2. Node.js 20 설치 ---------------------
log_step "2/6 Node.js 20 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node --version
npm --version
log_info "Node.js 20 설치 완료"

# --------------------- 3. Nginx 설치 ---------------------
log_step "3/6 Nginx 설치 중..."
apt install -y nginx

systemctl start nginx
systemctl enable nginx

log_info "Nginx 설치 완료"

# --------------------- 4. 프로젝트 디렉토리 설정 ---------------------
log_step "4/6 프로젝트 디렉토리 설정 중..."

mkdir -p ${PROJECT_DIR}
mkdir -p ${PROJECT_DIR}/frontend-user
mkdir -p ${PROJECT_DIR}/frontend-admin

# mycard 사용자 생성
if ! id "mycard" &>/dev/null; then
    useradd -r -s /bin/false -d ${PROJECT_DIR} mycard
fi

chown -R mycard:mycard ${PROJECT_DIR}
log_info "프로젝트 디렉토리 생성 완료: ${PROJECT_DIR}"

# --------------------- 5. Nginx 설정 ---------------------
log_step "5/6 Nginx 설정 중..."

cat > /etc/nginx/sites-available/mycard << EOF
# MyCard - Nginx Configuration
# 3-Tier Architecture

# 사용자 포털
server {
    listen 80;
    server_name ${USER_DOMAIN};

    root ${PROJECT_DIR}/frontend-user/dist;
    index index.html;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 프록시 (백엔드 서버로 전달)
    location /api {
        proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # CORS 헤더 (필요시)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    }

    # SPA 라우팅
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# 관리자 포털
server {
    listen 80;
    server_name ${ADMIN_DOMAIN};

    root ${PROJECT_DIR}/frontend-admin/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api {
        proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# 활성화
ln -sf /etc/nginx/sites-available/mycard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx 문법 검사
nginx -t && systemctl reload nginx

log_info "Nginx 설정 완료"

# --------------------- 6. 방화벽 설정 ---------------------
log_step "6/6 방화벽 설정 중..."

if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    log_info "UFW 방화벽 설정 완료 - 80, 443 포트 열림"
else
    log_warn "UFW가 설치되어 있지 않습니다."
fi

# --------------------- 완료 ---------------------
echo ""
echo "=========================================="
echo "   Frontend Server 설치 완료!"
echo "=========================================="
echo ""
log_info "설치된 소프트웨어:"
echo "  - Node.js $(node --version)"
echo "  - npm $(npm --version)"
echo "  - Nginx $(nginx -v 2>&1)"
echo ""
log_info "다음 단계:"
echo ""
echo "  1. 프론트엔드 소스 복사 및 빌드"
echo ""
echo "     # 사용자 포털"
echo "     scp -r frontend-user/* user@$(hostname -I | awk '{print $1}'):${PROJECT_DIR}/frontend-user/"
echo "     cd ${PROJECT_DIR}/frontend-user"
echo "     npm install"
echo "     npm run build"
echo ""
echo "     # 관리자 포털"
echo "     scp -r frontend-admin/* user@$(hostname -I | awk '{print $1}'):${PROJECT_DIR}/frontend-admin/"
echo "     cd ${PROJECT_DIR}/frontend-admin"
echo "     npm install"
echo "     npm run build"
echo ""
echo "  2. 소유권 변경"
echo "     chown -R mycard:mycard ${PROJECT_DIR}"
echo ""
echo "  3. Nginx 재시작"
echo "     systemctl restart nginx"
echo ""
log_info "hosts 파일 설정 (클라이언트 PC에서):"
echo "  $(hostname -I | awk '{print $1}') ${USER_DOMAIN} ${ADMIN_DOMAIN}"
echo ""
log_info "접속 URL:"
echo "  사용자 포털: http://${USER_DOMAIN}"
echo "  관리자 포털: http://${ADMIN_DOMAIN}"
echo ""
