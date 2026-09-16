# Spring Boot WAR를 빌드해서 Tomcat에 배포하는 백엔드(WAS) 이미지
FROM gradle:8.5-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle bootWar --no-daemon -x test

# api.war 파일명을 그대로 유지해야 Tomcat이 컨텍스트패스 /api로 배포함 (nginx의 /api/ 프록시와 일치)
FROM tomcat:10.1-jdk21-temurin
COPY --from=build /app/build/libs/api.war /usr/local/tomcat/webapps/api.war
EXPOSE 8080
