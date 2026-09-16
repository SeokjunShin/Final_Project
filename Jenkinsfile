// Phase 2 CWPP/CVE 테스트용 파이프라인: 이미지 빌드 -> ECR push -> Tatum CI/CD 스캔
pipeline {
    agent any

    environment {
        AWS_REGION      = 'ap-northeast-2'
        AWS_ACCOUNT_ID  = '453722412844'
        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        ECR_BACKEND     = "${ECR_REGISTRY}/cnapp-test-backend"
        ECR_FRONTEND    = "${ECR_REGISTRY}/cnapp-test-frontend-user"

        TATUM_API_SERVER_URL = 'https://demo.console.tatumsecurity.com'
        TATUM_TENANT_ID       = 'a62c649e-53cd-4806-b8aa-1b12cc6c68e1'
        TATUM_ACCESS_KEY      = credentials('tatum-access-key')
    }

    stages {
        stage('ECR Login') {
            steps {
                sh '''
                    aws ecr get-login-password --region $AWS_REGION \
                      | docker login --username AWS --password-stdin $ECR_REGISTRY
                '''
            }
        }

        stage('Build & Push Backend') {
            steps {
                sh '''
                    docker build -t $ECR_BACKEND:$BUILD_NUMBER -f backend/Dockerfile backend
                    docker push $ECR_BACKEND:$BUILD_NUMBER
                '''
            }
        }

        stage('Build & Push Frontend') {
            steps {
                // frontend-user는 ../packages/shared를 참조하는 구조라 빌드 컨텍스트는 레포 루트
                sh '''
                    docker build -t $ECR_FRONTEND:$BUILD_NUMBER -f frontend-user/Dockerfile .
                    docker push $ECR_FRONTEND:$BUILD_NUMBER
                '''
            }
        }

        stage('Tatum CI/CD Scan - Backend') {
            steps {
                sh 'curl -o- -k "$TATUM_API_SERVER_URL/api/v3/cicd/run" | bash -s -- $ECR_BACKEND:$BUILD_NUMBER'
            }
        }

        stage('Tatum CI/CD Scan - Frontend') {
            steps {
                sh 'curl -o- -k "$TATUM_API_SERVER_URL/api/v3/cicd/run" | bash -s -- $ECR_FRONTEND:$BUILD_NUMBER'
            }
        }
    }
}
