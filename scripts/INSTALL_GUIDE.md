# MyCard 서버 설치 가이드

## Ubuntu 24.04 서버 설치 (Docker 없이)

### 빠른 설치 (원클릭)

1. 프로젝트 폴더를 Ubuntu 서버로 복사 (scp, sftp 등)
2. 다음 명령어 실행:

```bash
cd /path/to/Final_project/scripts
sudo chmod +x *.sh
sudo ./install.sh
```

### 단계별 설치

#### 1단계: 환경 설정
```bash
sudo ./setup_ubuntu.sh
```

설치되는 소프트웨어:
- Java 21 (OpenJDK)
- Node.js 20
- MySQL 8.0
- Nginx

#### 2단계: 프로젝트 배포
```bash
sudo ./deploy.sh
```

수행 작업:
- 프로젝트 파일 복사 (/opt/mycard)
- 백엔드 빌드 (Gradle)
- 프론트엔드 빌드 (npm)
- 서비스 시작

---

## 설치 후 설정

### 1. 호스트 파일 수정 (클라이언트 PC)

Windows:
```
C:\Windows\System32\drivers\etc\hosts
```

Linux/Mac:
```
/etc/hosts
```

추가할 내용:
```
<서버IP> mycard.local admin.mycard.local
```

### 2. 접속 URL

| 서비스 | URL |
|--------|-----|
| 사용자 포털 | http://mycard.local |
| 관리자 포털 | http://admin.mycard.local |
| API | http://서버IP:8080/api |

### 3. 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@mycard.local | MyCard!234 |
| 사용자 | user1@mycard.local | MyCard!234 |
| 사용자 | user2@mycard.local | MyCard!234 |
| 상담원 | op1@mycard.local | MyCard!234 |

---

## 서비스 관리

```bash
# 백엔드 서비스
sudo systemctl start mycard-backend     # 시작
sudo systemctl stop mycard-backend      # 중지
sudo systemctl restart mycard-backend   # 재시작
sudo systemctl status mycard-backend    # 상태 확인

# 로그 확인
sudo journalctl -u mycard-backend -f    # 실시간 로그
sudo tail -f /opt/mycard/logs/backend.log

# Nginx
sudo systemctl restart nginx
sudo nginx -t                           # 설정 검사

# MySQL
sudo systemctl status mysql
sudo mysql -u mycard -p mycard          # DB 접속
```

---

## 문제 해결

### 백엔드 시작 실패
```bash
# 로그 확인
sudo journalctl -u mycard-backend -n 100

# 직접 실행하여 오류 확인
cd /opt/mycard/backend
sudo -u mycard ./gradlew bootRun
```

### MySQL 연결 실패
```bash
# MySQL 상태 확인
sudo systemctl status mysql

# MySQL 접속 테스트
mysql -u mycard -pmycard_password -e "SELECT 1;"
```

### Nginx 502 오류
```bash
# 백엔드가 실행 중인지 확인
curl http://localhost:8080/api/health

# Nginx 설정 확인
sudo nginx -t
sudo cat /var/log/nginx/error.log
```

---

## 디렉토리 구조

```
/opt/mycard/
├── backend/           # Spring Boot 백엔드
│   ├── build/
│   └── gradlew
├── frontend-user/     # 사용자 포털
│   ├── dist/          # 빌드 결과
│   └── node_modules/
├── frontend-admin/    # 관리자 포털
│   ├── dist/
│   └── node_modules/
├── logs/              # 로그 파일
│   ├── backend.log
│   └── backend-error.log
└── uploads/           # 업로드 파일
```

---

## 설정 파일 위치

| 파일 | 위치 |
|------|------|
| Nginx 설정 | /etc/nginx/sites-available/mycard |
| Systemd 서비스 | /etc/systemd/system/mycard-backend.service |
| MySQL 설정 | /etc/mysql/mysql.conf.d/mysqld.cnf |
| Java 환경변수 | /etc/profile.d/java.sh |
