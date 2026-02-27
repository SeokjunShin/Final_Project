# MyCard 3-Tier 배포 트러블슈팅 보고서

## 개요
- **프로젝트**: MyCard 카드 관리 시스템
- **배포 환경**: VMware Ubuntu 24.04 LTS (3-Tier 아키텍처)
- **작업 기간**: 2026년 2월 27일
- **작성자**: 배포팀

## 시스템 구성

| 서버 | IP | 역할 | 주요 서비스 |
|------|-----|------|-------------|
| Frontend | 192.168.10.137 | 웹 서버 | Nginx (User: 80, Admin: 8081) |
| Backend | 192.168.10.134 | API 서버 | Spring Boot (8080) |
| Database | 192.168.10.135 | DB 서버 | MySQL 8.0 (3306) |

---

## 이슈 목록

### 이슈 #1: Gradle Wrapper JAR 파일 누락

**증상**
```
Error: Could not find or load main class org.gradle.wrapper.GradleWrapperMain
Caused by: java.lang.ClassNotFoundException: org.gradle.wrapper.GradleWrapperMain
```

**원인**
- `gradle/wrapper/gradle-wrapper.jar` 파일이 `.gitignore`에 의해 제외됨
- Git 저장소에 해당 파일이 존재하지 않음

**해결 방법**
```bash
# 로컬에서 JAR 파일 생성 후 git에 추가
cd backend
gradle wrapper
git add -f gradle/wrapper/gradle-wrapper.jar
git commit -m "fix: gradle-wrapper.jar 추가"
git push
```

**예방 조치**
- `.gitignore`에서 `gradle-wrapper.jar` 예외 처리 추가

---

### 이슈 #2: Gradlew 실행 권한 오류

**증상**
```
-bash: ./gradlew: Permission denied
```

**원인**
- Git에서 clone 시 실행 권한이 보존되지 않음
- Windows에서 작업 후 Linux로 배포 시 발생하는 일반적인 문제

**해결 방법**
```bash
chmod +x gradlew
./gradlew bootRun
```

**예방 조치**
- 배포 스크립트에 `chmod +x gradlew` 명령 포함

---

### 이슈 #3: 로그 디렉토리 미존재

**증상**
```
Failed to create parent directories for [/var/log/mycard/application.log]
```

**원인**
- Spring Boot 애플리케이션의 로그 경로 `/var/log/mycard/`가 존재하지 않음
- 일반 사용자 권한으로 `/var/log` 하위에 디렉토리 생성 불가

**해결 방법**
```bash
sudo mkdir -p /var/log/mycard
sudo chown $USER:$USER /var/log/mycard
```

**예방 조치**
- 배포 스크립트에 디렉토리 생성 로직 포함
- systemd 서비스 파일에서 `ExecStartPre`로 디렉토리 생성

---

### 이슈 #4: MySQL 연결 거부

**증상**
```
com.mysql.cj.jdbc.exceptions.CommunicationsException: 
Communications link failure - Connection refused
```

**원인**
- Backend 서버에서 DB 서버(192.168.10.135)로의 연결 설정 누락
- 기본값이 `localhost:3306`으로 설정되어 있음
- MySQL의 `bind-address`가 127.0.0.1로 제한됨

**해결 방법**

1. **Backend 서버 환경변수 설정** (`/etc/mycard/mycard-api.env`)
```bash
DB_URL=jdbc:mysql://192.168.10.135:3306/mycard?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul
DB_USERNAME=mycard
DB_PASSWORD=mycard_password
```

2. **MySQL 원격 접속 허용** (DB 서버)
```bash
# /etc/mysql/mysql.conf.d/mysqld.cnf
bind-address = 0.0.0.0

# MySQL 사용자 권한
CREATE USER 'mycard'@'192.168.10.%' IDENTIFIED BY 'mycard_password';
GRANT ALL PRIVILEGES ON mycard.* TO 'mycard'@'192.168.10.%';
FLUSH PRIVILEGES;
```

3. **방화벽 설정**
```bash
sudo ufw allow from 192.168.10.134 to any port 3306
```

---

### 이슈 #5: 포트 8080 충돌

**증상**
```
Web server failed to start. Port 8080 was already in use.
```

**원인**
- 이전 실행된 Java 프로세스가 종료되지 않고 포트 점유 중
- 여러 번 테스트 실행 후 좀비 프로세스 발생

**해결 방법**
```bash
# 기존 Java 프로세스 종료
sudo pkill -f "java.*mycard"
# 또는
sudo lsof -i :8080
sudo kill -9 <PID>

# 서비스 재시작
sudo systemctl restart mycard-api
```

**예방 조치**
- systemd 서비스 사용으로 프로세스 관리 일원화
- 배포 스크립트에 기존 프로세스 종료 로직 포함

---

### 이슈 #6: CORS (Cross-Origin Resource Sharing) 오류

**증상**
```
Access to XMLHttpRequest at 'http://192.168.10.134:8080/api/...' 
from origin 'http://192.168.10.137' has been blocked by CORS policy
```

**원인**
- Backend의 CORS 설정이 하드코딩되어 있음
- Frontend 서버 IP가 허용 목록에 없음

**해결 방법**

1. **SecurityConfig.java 수정** - 환경변수 기반 CORS 설정
```java
@Value("${app.cors.allowed-origins:}")
private String corsAllowedOrigins;

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    
    List<String> origins = new ArrayList<>(List.of(
        "http://localhost:5173", "http://localhost:5174",
        "http://127.0.0.1:5173", "http://127.0.0.1:5174"
    ));
    
    if (corsAllowedOrigins != null && !corsAllowedOrigins.isBlank()) {
        origins.addAll(Arrays.asList(corsAllowedOrigins.split(",")));
    }
    
    config.setAllowedOrigins(origins);
    // ...
}
```

2. **환경변수 설정** (`/etc/mycard/mycard-api.env`)
```bash
CORS_ALLOWED_ORIGINS=http://192.168.10.137,http://192.168.10.137:8081
```

**예방 조치**
- CORS 설정을 환경변수로 분리하여 배포 환경별 유연한 설정 가능

---

### 이슈 #7: Admin 페이지 500 Internal Server Error

**증상**
- http://192.168.10.137:8081 접속 시 500 에러 발생
- Nginx 에러 로그: `rewrite or internal redirection cycle while internally redirecting to "/index.html"`

**원인**
- `/var/www/mycard/admin/` 디렉토리가 존재하지 않음
- Admin Frontend 빌드 파일이 배포되지 않음
- Nginx가 존재하지 않는 파일로 리다이렉트 시도

**해결 방법**
```bash
# Admin Frontend 빌드
cd /opt/mycard/frontend-admin
npm install
npm run build

# 빌드 결과물 배포
sudo mkdir -p /var/www/mycard/admin
sudo cp -r dist/* /var/www/mycard/admin/
sudo chown -R www-data:www-data /var/www/mycard/admin

# Nginx 재로드
sudo systemctl reload nginx
```

---

### 이슈 #8: Admin 포털 도메인 접근 제한

**증상**
- Admin 페이지 접속 시 "접근 불가" 메시지 표시
- "관리자 포털은 admin.mycard.local 도메인에서만 접근할 수 있습니다."

**원인**
- Frontend 코드에 도메인 체크 로직이 하드코딩됨
- IP 주소로 접속 시 접근 차단

**해결 방법**

**App.tsx 수정** - 내부 IP 접속 허용
```typescript
const isAllowedHost = () => {
  const host = window.location.hostname;
  // 로컬/개발 환경
  if (host === 'admin.mycard.local' || host === 'localhost' || host === '127.0.0.1') return true;
  if (import.meta.env.DEV && window.location.port === '5174') return true;
  
  // 프로덕션: 8081 포트(admin nginx) 허용
  if (window.location.port === '8081') return true;
  
  // 내부 네트워크 IP 허용 (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return true;
  
  return false;
};
```

**재빌드 및 배포 필요**
```bash
git pull  # 최신 코드 받기
npm run build
sudo cp -r dist/* /var/www/mycard/admin/
sudo systemctl reload nginx
```

---

## 해결 완료 현황

| 이슈 # | 상태 | 설명 |
|--------|------|------|
| #1 | ✅ 완료 | Gradle Wrapper JAR 추가 |
| #2 | ✅ 완료 | 실행 권한 부여 |
| #3 | ✅ 완료 | 로그 디렉토리 생성 |
| #4 | ✅ 완료 | DB 연결 설정 |
| #5 | ✅ 완료 | 포트 충돌 해결 |
| #6 | ✅ 완료 | CORS 환경변수화 |
| #7 | ✅ 완료 | Admin 빌드 배포 |
| #8 | ⏳ 진행중 | Admin IP 접근 허용 (재빌드 필요) |

---

## 권장 사항

### 1. 배포 자동화
- CI/CD 파이프라인 구축 (GitHub Actions, Jenkins 등)
- 빌드 및 배포 스크립트 통합

### 2. 모니터링 설정
- 로그 수집 시스템 구축 (ELK Stack, Loki 등)
- 서버 상태 모니터링 (Prometheus + Grafana)

### 3. 보안 강화
- HTTPS 적용 (Let's Encrypt)
- 방화벽 규칙 최소화
- DB 접근 IP 제한 유지

### 4. 문서화
- 신규 팀원을 위한 환경 설정 가이드 작성
- 트러블슈팅 가이드 지속 업데이트

---

## 참고 명령어 모음

### 서비스 관리
```bash
# Backend
sudo systemctl start/stop/restart/status mycard-api
sudo journalctl -u mycard-api -f

# Nginx
sudo systemctl reload nginx
sudo nginx -t  # 설정 검증

# MySQL
sudo systemctl status mysql
```

### 로그 확인
```bash
# Backend 로그
tail -f /var/log/mycard/application.log

# Nginx 로그
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 네트워크 디버깅
```bash
# 포트 확인
sudo lsof -i :8080
sudo netstat -tlnp | grep 8080

# 연결 테스트
curl -X POST http://192.168.10.134:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mycard.local","password":"MyCard!234"}'
```

---

*문서 최종 수정: 2026-02-27*
