#!/bin/bash
# =====================================================
# MyCard - 프로젝트 배포 스크립트
# setup_ubuntu.sh 실행 후 사용
# =====================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

PROJECT_DIR="/opt/mycard"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "=========================================="
echo "   MyCard 프로젝트 배포"
echo "=========================================="
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
    log_error "이 스크립트는 root 권한이 필요합니다. sudo로 실행해주세요."
    exit 1
fi

# --------------------- 1. 프로젝트 파일 복사 ---------------------
log_step "1/5 프로젝트 파일 복사 중..."

# 백엔드 복사
cp -r ${SOURCE_DIR}/backend ${PROJECT_DIR}/
chown -R mycard:mycard ${PROJECT_DIR}/backend

# 프론트엔드 복사
cp -r ${SOURCE_DIR}/frontend-user ${PROJECT_DIR}/
chown -R mycard:mycard ${PROJECT_DIR}/frontend-user

# frontend-admin이 있으면 복사
if [ -d "${SOURCE_DIR}/frontend-admin" ]; then
    cp -r ${SOURCE_DIR}/frontend-admin ${PROJECT_DIR}/
    chown -R mycard:mycard ${PROJECT_DIR}/frontend-admin
fi

log_info "프로젝트 파일 복사 완료"

# --------------------- 2. Gradle Wrapper 실행 권한 ---------------------
log_step "2/5 Gradle Wrapper 권한 설정 중..."
chmod +x ${PROJECT_DIR}/backend/gradlew
log_info "Gradle Wrapper 권한 설정 완료"

# --------------------- 3. 백엔드 빌드 ---------------------
log_step "3/5 백엔드 빌드 중... (시간이 걸릴 수 있습니다)"

cd ${PROJECT_DIR}/backend
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
sudo -u mycard ./gradlew build -x test --no-daemon

log_info "백엔드 빌드 완료"

# --------------------- 4. 프론트엔드 빌드 ---------------------
log_step "4/5 프론트엔드 빌드 중..."

# 사용자 포털
cd ${PROJECT_DIR}/frontend-user
sudo -u mycard npm install
sudo -u mycard npm run build

log_info "사용자 포털 빌드 완료"

# 관리자 포털 (있으면)
if [ -d "${PROJECT_DIR}/frontend-admin" ]; then
    cd ${PROJECT_DIR}/frontend-admin
    sudo -u mycard npm install
    sudo -u mycard npm run build
    log_info "관리자 포털 빌드 완료"
fi

# --------------------- 5. 서비스 시작 ---------------------
log_step "5/5 서비스 시작 중..."

# 디렉토리 권한 설정
chown -R mycard:mycard ${PROJECT_DIR}
chmod -R 755 ${PROJECT_DIR}

# 백엔드 서비스 시작
systemctl start mycard-backend
systemctl enable mycard-backend

# Nginx 재시작
systemctl restart nginx

# 서비스 상태 확인
sleep 5
if systemctl is-active --quiet mycard-backend; then
    log_info "백엔드 서비스 실행 중"
else
    log_warn "백엔드 서비스 시작 실패. 로그를 확인하세요:"
    echo "  journalctl -u mycard-backend -n 50"
fi

echo ""
echo "=========================================="
echo "   배포 완료!"
echo "=========================================="
echo ""
log_info "서비스 상태:"
systemctl status mycard-backend --no-pager || true
echo ""
log_info "접속 URL:"
echo "  - 사용자 포털: http://mycard.local"
echo "  - 관리자 포털: http://admin.mycard.local"
echo "  - API: http://localhost:8080/api"
echo ""
log_info "/etc/hosts에 다음 추가 필요 (클라이언트 PC):"
echo "  <서버IP> mycard.local admin.mycard.local"
echo ""
log_info "테스트 계정:"
echo "  - 관리자: admin@mycard.local / MyCard!234"
echo "  - 사용자: user1@mycard.local / MyCard!234"
echo ""
