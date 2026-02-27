#!/bin/bash
# =====================================================
# MyCard - Backend Server Setup Script
# Ubuntu 24.04 - Java 21 + Spring Boot
# 3-Tier Architecture: Backend Server
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

# DB 서버 정보 (setup_db_server.sh 실행 후 출력된 정보 입력)
DB_HOST="${1:-192.168.1.101}"
DB_PORT="${2:-3306}"
DB_NAME="${3:-mycard}"
DB_USER="${4:-mycard}"
DB_PASSWORD="${5:-mycard_password}"

# JWT 시크릿 (운영환경에서는 반드시 변경!)
JWT_SECRET="your-256-bit-secret-key-for-jwt-signing-must-be-at-least-32-chars-long"

echo ""
echo "=========================================="
echo "   MyCard Backend Server Setup"
echo "   Ubuntu 24.04 - Java 21"
echo "=========================================="
echo ""
echo "DB Server: ${DB_HOST}:${DB_PORT}"
echo "Database: ${DB_NAME}"
echo ""

# --------------------- 1. System Update ---------------------
log_step "1/6 시스템 업데이트 중..."
apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common

# --------------------- 2. Java 21 설치 ---------------------
log_step "2/6 Java 21 (OpenJDK) 설치 중..."
apt install -y openjdk-21-jdk

# JAVA_HOME 설정
cat > /etc/profile.d/java.sh << 'EOF'
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
EOF
source /etc/profile.d/java.sh

java -version
log_info "Java 21 설치 완료"

# --------------------- 3. 프로젝트 디렉토리 설정 ---------------------
log_step "3/6 프로젝트 디렉토리 설정 중..."

mkdir -p ${PROJECT_DIR}
mkdir -p ${PROJECT_DIR}/logs
mkdir -p ${PROJECT_DIR}/uploads
mkdir -p ${PROJECT_DIR}/backend

# mycard 사용자 생성
if ! id "mycard" &>/dev/null; then
    useradd -r -s /bin/false -d ${PROJECT_DIR} mycard
fi

chown -R mycard:mycard ${PROJECT_DIR}
log_info "프로젝트 디렉토리 생성 완료: ${PROJECT_DIR}"

# --------------------- 4. 환경변수 설정 파일 생성 ---------------------
log_step "4/6 환경변수 설정 파일 생성 중..."

cat > ${PROJECT_DIR}/backend.env << EOF
# MyCard Backend Environment Variables
DB_URL=jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
EOF

chown mycard:mycard ${PROJECT_DIR}/backend.env
chmod 600 ${PROJECT_DIR}/backend.env

log_info "환경변수 설정 파일 생성 완료"

# --------------------- 5. Systemd 서비스 생성 ---------------------
log_step "5/6 Systemd 서비스 설정 중..."

cat > /etc/systemd/system/mycard-backend.service << EOF
[Unit]
Description=MyCard Backend API Service
After=network.target

[Service]
Type=simple
User=mycard
Group=mycard
WorkingDirectory=/opt/mycard/backend
EnvironmentFile=/opt/mycard/backend.env
Environment="JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64"
ExecStart=/opt/mycard/backend/gradlew bootRun --no-daemon
Restart=on-failure
RestartSec=10
StandardOutput=append:/opt/mycard/logs/backend.log
StandardError=append:/opt/mycard/logs/backend-error.log

# 메모리 설정
Environment="JAVA_OPTS=-Xms512m -Xmx1024m"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
log_info "Systemd 서비스 설정 완료"

# --------------------- 6. 방화벽 설정 ---------------------
log_step "6/6 방화벽 설정 중..."

if command -v ufw &> /dev/null; then
    ufw allow 8080/tcp
    ufw --force enable
    log_info "UFW 방화벽 설정 완료 - 8080 포트 열림"
else
    log_warn "UFW가 설치되어 있지 않습니다. 필요시 8080 포트를 수동으로 열어주세요."
fi

# --------------------- 완료 ---------------------
echo ""
echo "=========================================="
echo "   Backend Server 설치 완료!"
echo "=========================================="
echo ""
log_info "설치된 소프트웨어:"
echo "  - Java $(java -version 2>&1 | head -n 1)"
echo ""
log_info "다음 단계:"
echo "  1. 프로젝트 backend 폴더를 ${PROJECT_DIR}/backend로 복사"
echo "     예: scp -r backend/* user@$(hostname -I | awk '{print $1}'):${PROJECT_DIR}/backend/"
echo ""
echo "  2. Gradle Wrapper 실행 권한 설정"
echo "     chmod +x ${PROJECT_DIR}/backend/gradlew"
echo ""
echo "  3. 소유권 변경"
echo "     chown -R mycard:mycard ${PROJECT_DIR}/backend"
echo ""
echo "  4. 서비스 시작"
echo "     systemctl start mycard-backend"
echo "     systemctl enable mycard-backend"
echo ""
log_info "서비스 관리 명령어:"
echo "  systemctl start mycard-backend    # 시작"
echo "  systemctl stop mycard-backend     # 중지"
echo "  systemctl restart mycard-backend  # 재시작"
echo "  systemctl status mycard-backend   # 상태 확인"
echo "  journalctl -u mycard-backend -f   # 로그 확인"
echo ""
log_info "API 엔드포인트:"
echo "  http://$(hostname -I | awk '{print $1}'):8080/api"
echo ""
