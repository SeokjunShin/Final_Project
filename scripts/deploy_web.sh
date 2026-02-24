#!/bin/bash
# =====================================================
# MyCard Frontend Deploy Script
# Deploys both user and admin portals to Nginx web root
# =====================================================

set -e  # Exit on error

# --------------------- Configuration ---------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

WEB_ROOT="/var/www/mycard"
USER_PORTAL_SRC="${PROJECT_ROOT}/frontend-user/dist"
ADMIN_PORTAL_SRC="${PROJECT_ROOT}/frontend-admin/dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

check_build() {
    local path=$1
    local name=$2
    
    if [ ! -d "$path" ]; then
        log_error "$name build directory not found: $path"
        log_error "Please run 'npm run build' in the $name directory first."
        return 1
    fi
    
    if [ ! -f "$path/index.html" ]; then
        log_error "$name index.html not found. Build may have failed."
        return 1
    fi
    
    return 0
}

deploy_portal() {
    local src=$1
    local dest=$2
    local name=$3
    
    log_info "Deploying $name to $dest..."

    sudo mkdir -p "$dest"

    # Sync files (delete stale files from previous deployment)
    sudo rsync -av --delete "$src"/ "$dest"/

    sudo chown -R www-data:www-data "$dest"
    sudo chmod -R 755 "$dest"
    
    log_info "$name deployed successfully!"
}

# --------------------- Main ---------------------
echo "=========================================="
echo "  MyCard Frontend Deployment Script"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    log_warn "This script requires sudo privileges."
fi

# Check builds exist
log_info "Checking build artifacts..."

USER_BUILD_OK=true
ADMIN_BUILD_OK=true

if ! check_build "$USER_PORTAL_SRC" "User Portal"; then
    USER_BUILD_OK=false
fi

if ! check_build "$ADMIN_PORTAL_SRC" "Admin Portal"; then
    ADMIN_BUILD_OK=false
fi

if [ "$USER_BUILD_OK" = false ] && [ "$ADMIN_BUILD_OK" = false ]; then
    log_error "No builds found. Aborting deployment."
    exit 1
fi

# Create web root if not exists
sudo mkdir -p "$WEB_ROOT"

# Deploy portals
if [ "$USER_BUILD_OK" = true ]; then
    deploy_portal "$USER_PORTAL_SRC" "${WEB_ROOT}/user" "User Portal"
else
    log_warn "Skipping User Portal deployment (build not found)"
fi

if [ "$ADMIN_BUILD_OK" = true ]; then
    deploy_portal "$ADMIN_PORTAL_SRC" "${WEB_ROOT}/admin" "Admin Portal"
else
    log_warn "Skipping Admin Portal deployment (build not found)"
fi

# Test Nginx configuration
log_info "Testing Nginx configuration..."
if sudo nginx -t; then
    log_info "Nginx configuration is valid."
    
    # Reload Nginx
    log_info "Reloading Nginx..."
    sudo systemctl reload nginx
    log_info "Nginx reloaded successfully!"
else
    log_error "Nginx configuration test failed!"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "User Portal:  http://mycard.local"
echo "Admin Portal: http://admin.mycard.local"
echo ""
