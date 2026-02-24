#!/bin/bash
# =====================================================
# MyCard API Deploy Script
# Deploys Spring Boot JAR to production server
# =====================================================

set -e  # Exit on error

# --------------------- Configuration ---------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

API_HOME="/opt/mycard/api"
JAR_NAME="mycard-api.jar"
JAR_SRC="${PROJECT_ROOT}/backend/build/libs/mycard-api-*.jar"
SERVICE_NAME="mycard-api"
BACKUP_DIR="/opt/mycard/backups"
LOG_DIR="/var/log/mycard"
UPLOAD_DIR="/var/lib/mycard/uploads"

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

check_jar() {
    local jar_files=(${JAR_SRC})
    
    if [ ${#jar_files[@]} -eq 0 ] || [ ! -f "${jar_files[0]}" ]; then
        log_error "JAR file not found. Please build the project first."
        log_error "Run: cd backend && ./gradlew clean bootJar"
        return 1
    fi
    
    # Find the latest JAR (in case multiple versions exist)
    LATEST_JAR=$(ls -t ${PROJECT_ROOT}/backend/build/libs/mycard-api-*.jar 2>/dev/null | grep -v plain | head -1)
    
    if [ -z "$LATEST_JAR" ]; then
        log_error "Could not find JAR file"
        return 1
    fi
    
    log_info "Found JAR: $LATEST_JAR"
    return 0
}

create_directories() {
    log_step "Creating directories..."
    
    sudo mkdir -p "$API_HOME"
    sudo mkdir -p "$BACKUP_DIR"
    sudo mkdir -p "$LOG_DIR"
    sudo mkdir -p "$UPLOAD_DIR"
    sudo mkdir -p "/etc/mycard"
    
    # Create mycard user if not exists
    if ! id "mycard" &>/dev/null; then
        log_info "Creating mycard user..."
        sudo useradd -r -s /bin/false -d "$API_HOME" mycard
    fi
    
    # Set ownership
    sudo chown -R mycard:mycard "$API_HOME"
    sudo chown -R mycard:mycard "$LOG_DIR"
    sudo chown -R mycard:mycard "$UPLOAD_DIR"
}

backup_current() {
    if [ -f "${API_HOME}/${JAR_NAME}" ]; then
        log_step "Backing up current JAR..."
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        sudo cp "${API_HOME}/${JAR_NAME}" "${BACKUP_DIR}/${JAR_NAME}.${TIMESTAMP}"
        
        # Keep only last 5 backups
        cd "$BACKUP_DIR"
        ls -t ${JAR_NAME}.* 2>/dev/null | tail -n +6 | xargs -r sudo rm -f
        log_info "Backup created: ${JAR_NAME}.${TIMESTAMP}"
    fi
}

stop_service() {
    log_step "Stopping ${SERVICE_NAME} service..."
    
    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
        sudo systemctl stop "$SERVICE_NAME"
        log_info "Service stopped."
        
        # Wait for service to fully stop
        sleep 3
    else
        log_warn "Service was not running."
    fi
}

deploy_jar() {
    log_step "Deploying new JAR..."
    
    sudo cp "$LATEST_JAR" "${API_HOME}/${JAR_NAME}"
    sudo chown mycard:mycard "${API_HOME}/${JAR_NAME}"
    sudo chmod 644 "${API_HOME}/${JAR_NAME}"
    
    log_info "JAR deployed to ${API_HOME}/${JAR_NAME}"
}

install_systemd_service() {
    log_step "Installing systemd service..."
    
    local service_file="${PROJECT_ROOT}/infra/systemd/mycard-api.service"
    
    if [ -f "$service_file" ]; then
        sudo cp "$service_file" "/etc/systemd/system/${SERVICE_NAME}.service"
        sudo systemctl daemon-reload
        sudo systemctl enable "$SERVICE_NAME"
        log_info "Systemd service installed and enabled."
    else
        log_warn "Service file not found: $service_file"
    fi
}

setup_env_file() {
    local env_example="${PROJECT_ROOT}/infra/env/mycard-api.env.example"
    local env_file="/etc/mycard/mycard-api.env"
    
    if [ ! -f "$env_file" ]; then
        if [ -f "$env_example" ]; then
            log_step "Creating environment file..."
            sudo cp "$env_example" "$env_file"
            sudo chmod 600 "$env_file"
            log_warn "Environment file created at $env_file"
            log_warn "⚠️  Please edit $env_file and set proper values!"
        else
            log_error "Environment example file not found: $env_example"
        fi
    else
        log_info "Environment file already exists."
    fi
}

start_service() {
    log_step "Starting ${SERVICE_NAME} service..."
    
    sudo systemctl start "$SERVICE_NAME"
    
    # Wait and check status
    sleep 5
    
    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
        log_info "Service started successfully!"
    else
        log_error "Service failed to start. Check logs with:"
        log_error "  sudo journalctl -u ${SERVICE_NAME} -f"
        return 1
    fi
}

health_check() {
    log_step "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health 2>/dev/null | grep -q "200"; then
            log_info "Health check passed! API is responding."
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo ""
    log_warn "Health check timed out. Service might still be starting."
    log_warn "Check status with: sudo systemctl status ${SERVICE_NAME}"
    return 1
}

# --------------------- Main ---------------------
echo "=========================================="
echo "  MyCard API Deployment Script"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    log_warn "This script requires sudo privileges."
fi

# Check JAR exists
log_info "Checking build artifacts..."
if ! check_jar; then
    exit 1
fi

# Create directories
create_directories

# Backup current version
backup_current

# Stop current service
stop_service

# Deploy new JAR
deploy_jar

# Install/update systemd service
install_systemd_service

# Setup environment file
setup_env_file

# Start service
start_service

# Health check
health_check

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Service Status: sudo systemctl status ${SERVICE_NAME}"
echo "View Logs:      sudo journalctl -u ${SERVICE_NAME} -f"
echo "API Docs:       http://localhost:8080/api/swagger-ui.html"
echo ""
