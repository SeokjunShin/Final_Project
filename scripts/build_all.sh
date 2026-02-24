#!/bin/bash
# =====================================================
# MyCard Full Build Script
# Builds both frontend and backend projects
# =====================================================

set -e  # Exit on error

# --------------------- Configuration ---------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --------------------- Functions ---------------------
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_dependencies() {
    log_step "Checking dependencies..."
    
    # Check Java
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
        if [ "$JAVA_VERSION" -ge 17 ]; then
            log_info "Java $JAVA_VERSION found ✓"
        else
            log_error "Java 17+ required. Found: $JAVA_VERSION"
            exit 1
        fi
    else
        log_error "Java not found. Please install JDK 17+"
        exit 1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            log_info "Node.js v$(node -v | cut -d'v' -f2) found ✓"
        else
            log_error "Node.js 18+ required. Found: v$(node -v)"
            exit 1
        fi
    else
        log_error "Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        log_info "npm $(npm -v) found ✓"
    else
        log_error "npm not found"
        exit 1
    fi
}

build_backend() {
    log_step "Building Backend (Spring Boot)..."
    
    cd "${PROJECT_ROOT}/backend"
    
    # Clean and build
    if [ -f "./gradlew" ]; then
        chmod +x ./gradlew
        ./gradlew clean bootJar --no-daemon
    else
        log_error "Gradle wrapper not found"
        exit 1
    fi
    
    # Verify build
    if ls build/libs/mycard-api-*.jar 1>/dev/null 2>&1; then
        JAR_SIZE=$(ls -lh build/libs/mycard-api-*.jar | grep -v plain | awk '{print $5}' | head -1)
        log_info "Backend build successful! (${JAR_SIZE})"
    else
        log_error "Backend build failed - JAR file not found"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
}

build_frontend_user() {
    log_step "Building User Portal (React)..."
    
    if [ ! -d "${PROJECT_ROOT}/frontend-user" ]; then
        log_warn "User portal directory not found. Skipping..."
        return 0
    fi
    
    cd "${PROJECT_ROOT}/frontend-user"
    
    # Install dependencies
    log_info "Installing npm dependencies..."
    npm ci --silent 2>/dev/null || npm install --silent
    
    # Build
    log_info "Building production bundle..."
    npm run build
    
    # Verify build
    if [ -f "dist/index.html" ]; then
        DIST_SIZE=$(du -sh dist | awk '{print $1}')
        log_info "User portal build successful! (${DIST_SIZE})"
    else
        log_error "User portal build failed"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
}

build_frontend_admin() {
    log_step "Building Admin Portal (React)..."
    
    if [ ! -d "${PROJECT_ROOT}/frontend-admin" ]; then
        log_warn "Admin portal directory not found. Skipping..."
        return 0
    fi
    
    cd "${PROJECT_ROOT}/frontend-admin"
    
    # Install dependencies
    log_info "Installing npm dependencies..."
    npm ci --silent 2>/dev/null || npm install --silent
    
    # Build
    log_info "Building production bundle..."
    npm run build
    
    # Verify build
    if [ -f "dist/index.html" ]; then
        DIST_SIZE=$(du -sh dist | awk '{print $1}')
        log_info "Admin portal build successful! (${DIST_SIZE})"
    else
        log_error "Admin portal build failed"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
}

# --------------------- Main ---------------------
echo "=========================================="
echo "  MyCard Full Build Script"
echo "=========================================="
echo ""

START_TIME=$(date +%s)

# Check dependencies
check_dependencies

echo ""

# Parse arguments
BUILD_BACKEND=true
BUILD_USER=true
BUILD_ADMIN=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            BUILD_USER=false
            BUILD_ADMIN=false
            shift
            ;;
        --frontend-only)
            BUILD_BACKEND=false
            shift
            ;;
        --user-only)
            BUILD_BACKEND=false
            BUILD_ADMIN=false
            shift
            ;;
        --admin-only)
            BUILD_BACKEND=false
            BUILD_USER=false
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --backend-only    Build only the backend"
            echo "  --frontend-only   Build only the frontends"
            echo "  --user-only       Build only the user portal"
            echo "  --admin-only      Build only the admin portal"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Build components
if [ "$BUILD_BACKEND" = true ]; then
    build_backend
fi

if [ "$BUILD_USER" = true ]; then
    build_frontend_user
fi

if [ "$BUILD_ADMIN" = true ]; then
    build_frontend_admin
fi

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "=========================================="
echo "  Build Complete!"
echo "=========================================="
echo ""
echo "Build time: ${MINUTES}m ${SECONDS}s"
echo ""
echo "Build artifacts:"
[ "$BUILD_BACKEND" = true ] && echo "  Backend: backend/build/libs/mycard-api-*.jar"
[ "$BUILD_USER" = true ] && [ -d "${PROJECT_ROOT}/frontend-user/dist" ] && echo "  User Portal: frontend-user/dist/"
[ "$BUILD_ADMIN" = true ] && [ -d "${PROJECT_ROOT}/frontend-admin/dist" ] && echo "  Admin Portal: frontend-admin/dist/"
echo ""
echo "Next steps:"
echo "  Deploy backend: ./scripts/deploy_api.sh"
echo "  Deploy frontend: ./scripts/deploy_web.sh"
echo ""
