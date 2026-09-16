# React(Vite) 사용자 포털을 빌드해서 Nginx로 서빙하는 프론트엔드 이미지
# 주의: ../packages/shared를 참조하는 모노레포 구조라 빌드 컨텍스트는 반드시 레포 루트여야 함
# 빌드 예: docker build -f frontend-user/Dockerfile -t mycard-frontend-user .   (레포 루트에서 실행)
FROM node:20-alpine AS build
WORKDIR /app
COPY packages/shared ./packages/shared
COPY frontend-user/package.json frontend-user/package-lock.json ./frontend-user/
WORKDIR /app/frontend-user
RUN npm ci
WORKDIR /app
COPY frontend-user ./frontend-user
WORKDIR /app/frontend-user
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/frontend-user/dist /usr/share/nginx/html
COPY frontend-user/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
