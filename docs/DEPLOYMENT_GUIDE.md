# MyCard 3-Tier 배포 가이드 (VMware Ubuntu 24.04)

## 목차
1. [구성 개요](#1-구성-개요)
2. [VMware 네트워크 사전 설정](#2-vmware-네트워크-사전-설정)
3. [공통 기본 세팅](#3-공통-기본-세팅-3대-vm-모두)
4. [고정 IP 설정](#4-고정-ip-설정netplan)
5. [VM3: DB 서버 구축](#5-vm3-db-서버-구축-mysql-80)
6. [VM2: Backend 서버 구축](#6-vm2-backend-서버-구축-java-21--spring-boot)
7. [VM1: Frontend 서버 구축](#7-vm1-frontend-서버-구축-nginx--react)
8. [접속 및 테스트](#8-접속-및-테스트)
9. [트러블슈팅](#9-트러블슈팅)

---

## 1. 구성 개요

### 서버 구성 (예시 IP)
| VM | 역할 | IP | 포트 | 주요 컴포넌트 |
|----|------|-----|------|--------------|
| VM1 | Frontend | 192.168.10.137 | 80, 8081 | Nginx, Node.js |
| VM2 | Backend | 192.168.10.134 | 8080 | Java 21, Spring Boot |
| VM3 | Database | 192.168.10.135 | 3306 | MySQL 8.0 |

### 도메인 (로컬 hosts 매핑)
- 사용자 포털: `mycard.local`
- 관리자 포털: `admin.mycard.local`

### 기본 자격 증명
| 용도 | 사용자 | 비밀번호 |
|------|--------|----------|
| MySQL root | root | MyCard@Root123 |
| MySQL 앱 계정 | mycard | mycard_password |
| 테스트 사용자 | user1@mycard.local | MyCard!234 |
| 테스트 관리자 | admin@mycard.local | MyCard!234 |

---

## 2. VMware 네트워크 사전 설정

### 2-1. 네트워크 요구사항
- 3대 VM이 **같은 대역**에 있어야 함 (서로 ping 가능)
- **인터넷 접속 필요** (apt install, git clone 용)

### 2-2. 추천 네트워크 구성
```
옵션 A: NAT 네트워크 (간단)
  - 모든 VM을 NAT로 설정
  - VMware가 자동으로 같은 대역 할당

옵션 B: NIC 2개 구성 (보안 강화)
  - NIC1: Host-only (내부 통신용)
  - NIC2: NAT (인터넷 접속용)
```

### 2-3. 통신 확인
각 VM에서 서로 ping 테스트:
```bash
ping -c 2 192.168.10.134  # Backend
ping -c 2 192.168.10.135  # DB
ping -c 2 192.168.10.137  # Frontend
```

---

## 3. 공통 기본 세팅 (3대 VM 모두)

### 3-1. 시스템 업데이트 + 기본 도구 설치
```bash
sudo apt update
sudo apt -y upgrade
sudo apt -y install git curl wget openssh-server ufw
sudo systemctl enable --now ssh
```

### 3-2. SSH 허용 (⚠️ 중요 - UFW 활성화 전 필수)
```bash
sudo ufw allow OpenSSH
```

> ⚠️ **주의**: 배포 스크립트가 `ufw --force enable`을 실행합니다.  
> SSH를 먼저 허용하지 않으면 원격 접속이 끊어집니다!

---

## 4. 고정 IP 설정(netplan)

DHCP로 IP가 이미 고정되어 있으면 생략 가능.

### 4-1. NIC 이름 확인
```bash
ip a
ip route | grep default
```
예: NIC가 `ens33`이라고 가정

### 4-2. netplan 설정
```bash
ls /etc/netplan/
sudo nano /etc/netplan/01-netcfg.yaml
```

**VM1 (Frontend) 예시:**
```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ens33:
      dhcp4: no
      addresses: [192.168.10.137/24]
      gateway4: 192.168.10.1
      nameservers:
        addresses: [1.1.1.1, 8.8.8.8]
```

**VM2 (Backend):** `addresses: [192.168.10.134/24]`  
**VM3 (DB):** `addresses: [192.168.10.135/24]`

### 4-3. 적용
```bash
sudo netplan apply
```

---

## 5. VM3: DB 서버 구축 (MySQL 8.0)

### 5-1. 레포 클론
```bash
cd ~
git clone https://github.com/SeokjunShin/Final_Project.git
cd Final_Project
```

### 5-2. DB 서버 셋업 스크립트 실행
```bash
# 인자: 백엔드 서버 IP
sudo bash scripts/setup_db_server.sh "192.168.10.134"
```

스크립트가 수행하는 작업:
- MySQL 8.0 설치 및 시작
- 데이터베이스 생성: `mycard`
- 계정 생성: `mycard` / `mycard_password`
- 원격 접속 허용 (`bind-address=0.0.0.0`)
- UFW 3306 포트 오픈

### 5-3. 상태 확인
```bash
sudo systemctl status mysql --no-pager
sudo ss -lntp | grep 3306
```

### 5-4. 원격 접속 테스트 (Backend VM에서)
```bash
mysql -h 192.168.10.135 -u mycard -pmycard_password mycard
```

---

## 6. VM2: Backend 서버 구축 (Java 21 + Spring Boot)

### 6-1. 레포 클론
```bash
cd ~
git clone https://github.com/SeokjunShin/Final_Project.git
cd Final_Project
```

### 6-2. Backend 서버 셋업 스크립트 실행
```bash
# 인자: DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD
sudo bash scripts/setup_backend_server.sh "192.168.10.135" "3306" "mycard" "mycard" "mycard_password"
```

스크립트가 수행하는 작업:
- Java 21 설치
- `/opt/mycard` 디렉토리 구조 생성
- `mycard` 시스템 사용자 생성
- `/opt/mycard/backend.env` 환경 설정 파일 생성
- systemd 서비스 등록
- UFW 8080 포트 오픈

### 6-3. 소스 코드 배포
```bash
sudo rsync -av --delete backend/ /opt/mycard/backend/
sudo chown -R mycard:mycard /opt/mycard/backend
```

### 6-4. 실행 권한 설정 (⚠️ 중요)
```bash
sudo chmod +x /opt/mycard/backend/gradlew
```

### 6-5. 로그 디렉토리 생성 (⚠️ 중요)
```bash
sudo mkdir -p /var/log/mycard
sudo chown mycard:mycard /var/log/mycard
```

### 6-6. 업로드 디렉토리 생성
```bash
sudo mkdir -p /var/lib/mycard/uploads
sudo chown -R mycard:mycard /var/lib/mycard
```

### 6-7. 서비스 시작
```bash
sudo systemctl start mycard-backend
sudo systemctl enable mycard-backend
```

### 6-8. 상태 확인
```bash
sudo systemctl status mycard-backend --no-pager
sudo journalctl -u mycard-backend -f
```

### 6-9. (대안) 수동 실행으로 테스트
서비스가 안 되면 직접 실행해서 에러 확인:
```bash
cd /opt/mycard/backend
sudo -u mycard DB_URL='jdbc:mysql://192.168.10.135:3306/mycard?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul' \
  DB_USERNAME=mycard \
  DB_PASSWORD=mycard_password \
  JWT_SECRET='your-256-bit-secret-key-for-jwt-signing-must-be-at-least-32-chars' \
  CORS_ALLOWED_ORIGINS='http://192.168.10.137,http://192.168.10.137:8081' \
  ./gradlew bootRun --no-daemon
```

> **⚠️ 중요**: `CORS_ALLOWED_ORIGINS`에 본인의 프론트엔드 서버 IP를 입력하세요!

---

## 7. VM1: Frontend 서버 구축 (Nginx + React)

### 7-1. 레포 클론
```bash
cd ~
git clone https://github.com/SeokjunShin/Final_Project.git
cd Final_Project
```

### 7-2. Frontend 서버 셋업 스크립트 실행
```bash
# 인자: BACKEND_HOST BACKEND_PORT USER_DOMAIN ADMIN_DOMAIN
sudo bash scripts/setup_frontend_server.sh "192.168.10.134" "8080" "mycard.local" "admin.mycard.local"
```

스크립트가 수행하는 작업:
- Node.js 20 설치
- Nginx 설치 및 설정
- 도메인별 가상 호스트 구성
- API 리버스 프록시 설정
- UFW 80/443 포트 오픈

### 7-3. 소스 코드 배포
```bash
# 프론트엔드 + shared 패키지 모두 복사 (⚠️ 중요)
sudo rsync -av --delete frontend-user/  /opt/mycard/frontend-user/
sudo rsync -av --delete frontend-admin/ /opt/mycard/frontend-admin/
sudo rsync -av --delete packages/       /opt/mycard/packages/
sudo chown -R mycard:mycard /opt/mycard
```

> **참고**: `@shared/*` 경로가 `../packages/shared/src/*`를 참조하므로  
> `packages` 폴더가 없으면 빌드 실패합니다.

### 7-4. 프론트엔드 빌드
```bash
# 사용자 포털
sudo -u mycard bash -c "cd /opt/mycard/frontend-user && npm install && npm run build"

# 관리자 포털
sudo -u mycard bash -c "cd /opt/mycard/frontend-admin && npm install && npm run build"
```

### 7-5. 빌드 결과물 배포
```bash
sudo mkdir -p /var/www/mycard/user /var/www/mycard/admin
sudo cp -r /opt/mycard/frontend-user/dist/* /var/www/mycard/user/
sudo cp -r /opt/mycard/frontend-admin/dist/* /var/www/mycard/admin/
sudo chown -R www-data:www-data /var/www/mycard
```

### 7-6. IP로 어드민 접속 설정 (선택사항)

도메인 없이 IP:포트로 접속하려면:

```bash
sudo tee /etc/nginx/sites-available/mycard-admin-ip << 'EOF'
server {
    listen 8081;
    server_name _;
    
    root /var/www/mycard/admin;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://192.168.10.134:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/mycard-admin-ip /etc/nginx/sites-enabled/
sudo ufw allow 8081/tcp
```

### 7-7. Nginx 재시작
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager
```

---

## 8. 접속 및 테스트

### 8-1. 방법 A: hosts 파일 사용 (추천)

**Windows** (`C:\Windows\System32\drivers\etc\hosts`):
```
192.168.10.137  mycard.local
192.168.10.137  admin.mycard.local
```

**Linux/Mac** (`/etc/hosts`):
```
192.168.10.137  mycard.local admin.mycard.local
```

접속:
- 사용자 포털: http://mycard.local
- 관리자 포털: http://admin.mycard.local

### 8-2. 방법 B: IP + 포트 사용

- 사용자 포털: http://192.168.10.137
- 관리자 포털: http://192.168.10.137:8081 (7-6 설정 완료 시)

### 8-3. 테스트 계정

| 포털 | 이메일 | 비밀번호 |
|------|--------|----------|
| 사용자 | user1@mycard.local | MyCard!234 |
| 관리자 | admin@mycard.local | MyCard!234 |

---

## 9. 트러블슈팅

### 9-1. gradlew 실행 안됨: "Permission denied"
```bash
sudo chmod +x /opt/mycard/backend/gradlew
```

### 9-2. gradlew 실행 안됨: "gradle-wrapper.jar not found"

git에서 jar 파일이 제외되어 있을 수 있음:
```bash
# 로컬 개발 PC에서
cd backend
git add -f gradle/wrapper/gradle-wrapper.jar
git commit -m "chore: gradle-wrapper.jar 추가"
git push

# 서버에서 다시 pull
cd ~/Final_Project
git pull
sudo rsync -av --delete backend/ /opt/mycard/backend/
```

### 9-3. Logback 오류: "/var/log/mycard 디렉토리 없음"
```
ERROR in ch.qos.logback.core.rolling.RollingFileAppender - Failed to create parent directories
```

해결:
```bash
sudo mkdir -p /var/log/mycard
sudo chown mycard:mycard /var/log/mycard
```

### 9-4. MySQL 연결 오류: "Communications link failure"

**원인 1: DB 서버 IP가 잘못됨**
```bash
# Backend 서버에서 확인
cat /opt/mycard/backend.env | grep DB_URL
```

**원인 2: MySQL이 원격 연결 허용 안함**
```bash
# DB 서버에서 확인
sudo grep bind-address /etc/mysql/mysql.conf.d/mysqld.cnf
# 0.0.0.0이어야 함. 127.0.0.1이면:
sudo sed -i 's/bind-address.*=.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
sudo systemctl restart mysql
```

**원인 3: MySQL 사용자 권한 없음**
```bash
# DB 서버에서 실행
sudo mysql -e "CREATE USER IF NOT EXISTS 'mycard'@'%' IDENTIFIED BY 'mycard_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON mycard.* TO 'mycard'@'%';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

**원인 4: 방화벽**
```bash
# DB 서버에서 확인
sudo ufw status
sudo ufw allow from 192.168.10.134 to any port 3306
```

### 9-5. 포트 충돌: "주소가 이미 사용 중입니다"
```bash
# 8080 포트 사용 프로세스 확인 및 종료
sudo lsof -i :8080
sudo kill $(sudo lsof -t -i :8080)

# 또는 모든 Java 프로세스 종료
sudo pkill -f java
```

### 9-6. 환경변수 URL의 & 문자 문제

bash에서 `&`가 백그라운드 실행으로 해석됨.

**잘못된 방법:**
```bash
DB_URL=jdbc:mysql://host:3306/mycard?useSSL=false&allowPublicKeyRetrieval=true
# &allowPublicKeyRetrieval=true 가 별도 명령으로 실행됨
```

**올바른 방법 (따옴표 사용):**
```bash
DB_URL='jdbc:mysql://host:3306/mycard?useSSL=false&allowPublicKeyRetrieval=true'
```

### 9-7. 프론트엔드 빌드 실패: "@shared/* 모듈을 찾을 수 없음"

`packages/shared` 폴더가 없어서 발생:
```bash
sudo rsync -av --delete packages/ /opt/mycard/packages/
sudo chown -R mycard:mycard /opt/mycard/packages
```

### 9-8. Nginx 502 Bad Gateway

백엔드 서버가 실행 중인지 확인:
```bash
# Backend 서버에서
sudo systemctl status mycard-backend
curl http://localhost:8080/api/actuator/health
```

Nginx 프록시 설정 확인:
```bash
# Frontend 서버에서
cat /etc/nginx/sites-available/mycard | grep proxy_pass
# IP가 올바른지 확인
```

### 9-9. CORS 오류

백엔드 SecurityConfig.java에서 프론트엔드 도메인/IP 허용 필요.

현재 허용된 origins 확인:
```bash
grep -A 10 "setAllowedOrigins" /opt/mycard/backend/src/main/java/com/mycard/api/config/SecurityConfig.java
```

---

## 부록: 서비스 관리 명령어

### Backend 서비스
```bash
sudo systemctl start mycard-backend    # 시작
sudo systemctl stop mycard-backend     # 중지
sudo systemctl restart mycard-backend  # 재시작
sudo systemctl status mycard-backend   # 상태 확인
sudo journalctl -u mycard-backend -f   # 로그 실시간 확인
```

### MySQL 서비스
```bash
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl restart mysql
sudo systemctl status mysql
```

### Nginx 서비스
```bash
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl status nginx
sudo nginx -t  # 설정 문법 검사
```

---

## 부록: 방화벽 포트 요약

| VM | 서비스 | 포트 | 허용 대상 |
|----|--------|------|-----------|
| VM1 (Frontend) | HTTP | 80 | 모든 곳 |
| VM1 (Frontend) | Admin (선택) | 8081 | 모든 곳 |
| VM2 (Backend) | API | 8080 | Frontend |
| VM3 (DB) | MySQL | 3306 | Backend |

```bash
# 확인
sudo ufw status verbose
```
