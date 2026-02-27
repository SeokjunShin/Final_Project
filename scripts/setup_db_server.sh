#!/bin/bash
# =====================================================
# MyCard - DB Server Setup Script
# Ubuntu 24.04 - MySQL 8.0 전용
# 3-Tier Architecture: DB Server
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
MYSQL_ROOT_PASSWORD="MyCard@Root123"
MYSQL_USER="mycard"
MYSQL_PASSWORD="mycard_password"
MYSQL_DATABASE="mycard"

# 원격 접속 허용할 IP (백엔드 서버 IP)
# 여러 IP는 공백으로 구분: "192.168.1.10 192.168.1.11"
BACKEND_SERVER_IP="${1:-192.168.1.%}"

echo ""
echo "=========================================="
echo "   MyCard DB Server Setup"
echo "   Ubuntu 24.04 - MySQL 8.0"
echo "=========================================="
echo ""
echo "백엔드 서버 IP: ${BACKEND_SERVER_IP}"
echo ""

# --------------------- 1. System Update ---------------------
log_step "1/5 시스템 업데이트 중..."
apt update && apt upgrade -y
apt install -y curl wget software-properties-common

# --------------------- 2. MySQL 8.0 설치 ---------------------
log_step "2/5 MySQL 8.0 설치 중..."

export DEBIAN_FRONTEND=noninteractive
apt install -y mysql-server mysql-client

systemctl start mysql
systemctl enable mysql

log_info "MySQL 8.0 설치 완료"

# --------------------- 3. MySQL 설정 ---------------------
log_step "3/5 MySQL 설정 중..."

# Root 비밀번호 설정
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';"

# 데이터베이스 생성
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 원격 접속용 사용자 생성 (백엔드 서버에서 접속)
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'${BACKEND_SERVER_IP}' IDENTIFIED BY '${MYSQL_PASSWORD}';"
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'${BACKEND_SERVER_IP}';"

# 로컬 접속용 사용자도 생성 (관리용)
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';"
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'localhost';"

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "FLUSH PRIVILEGES;"

log_info "MySQL 사용자 생성 완료"

# --------------------- 4. 원격 접속 허용 설정 ---------------------
log_step "4/5 MySQL 원격 접속 설정 중..."

# MySQL 설정 파일 수정 (원격 접속 허용)
MYSQL_CONF="/etc/mysql/mysql.conf.d/mysqld.cnf"

# bind-address를 0.0.0.0으로 변경 (모든 IP에서 접속 허용)
if grep -q "^bind-address" ${MYSQL_CONF}; then
    sed -i 's/^bind-address.*/bind-address = 0.0.0.0/' ${MYSQL_CONF}
else
    echo "bind-address = 0.0.0.0" >> ${MYSQL_CONF}
fi

# 타임존 설정
if ! grep -q "default-time-zone" ${MYSQL_CONF}; then
    echo "default-time-zone = '+09:00'" >> ${MYSQL_CONF}
fi

# 캐릭터셋 설정
if ! grep -q "character-set-server" ${MYSQL_CONF}; then
    echo "character-set-server = utf8mb4" >> ${MYSQL_CONF}
    echo "collation-server = utf8mb4_unicode_ci" >> ${MYSQL_CONF}
fi

systemctl restart mysql

log_info "MySQL 원격 접속 설정 완료"

# --------------------- 5. 방화벽 설정 ---------------------
log_step "5/5 방화벽 설정 중..."

# UFW가 설치되어 있으면 MySQL 포트 열기
if command -v ufw &> /dev/null; then
    ufw allow 3306/tcp
    ufw --force enable
    log_info "UFW 방화벽 설정 완료 - 3306 포트 열림"
else
    log_warn "UFW가 설치되어 있지 않습니다. 필요시 3306 포트를 수동으로 열어주세요."
fi

# --------------------- 완료 ---------------------
echo ""
echo "=========================================="
echo "   DB Server 설치 완료!"
echo "=========================================="
echo ""
log_info "MySQL 정보:"
echo "  - Host: $(hostname -I | awk '{print $1}')"
echo "  - Port: 3306"
echo "  - Root Password: ${MYSQL_ROOT_PASSWORD}"
echo "  - Database: ${MYSQL_DATABASE}"
echo "  - User: ${MYSQL_USER}"
echo "  - Password: ${MYSQL_PASSWORD}"
echo "  - 원격 접속 허용 IP: ${BACKEND_SERVER_IP}"
echo ""
log_info "연결 테스트 (백엔드 서버에서 실행):"
echo "  mysql -h $(hostname -I | awk '{print $1}') -u ${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE}"
echo ""
log_info "백엔드 서버 application.yml 설정:"
echo "  spring:"
echo "    datasource:"
echo "      url: jdbc:mysql://$(hostname -I | awk '{print $1}'):3306/${MYSQL_DATABASE}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul"
echo "      username: ${MYSQL_USER}"
echo "      password: ${MYSQL_PASSWORD}"
echo ""
