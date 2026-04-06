#!/bin/bash
# Deploy ShadowOS to a Vultr VM
# Prerequisites: SSH access to your Vultr VM

set -e

REMOTE_USER="${VULTR_USER:-root}"
REMOTE_HOST="${VULTR_HOST:-your-vultr-ip}"
REMOTE_DIR="/opt/shadowos"

echo "=== Deploying ShadowOS to $REMOTE_HOST ==="

# Sync files to remote
echo "[1/4] Syncing files..."
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '__pycache__' --exclude 'venv' --exclude '.env' \
  ./ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

# Install dependencies and build on remote
echo "[2/4] Installing dependencies..."
ssh "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
cd /opt/shadowos

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend
cd frontend
npm ci
npm run build
cd ..
EOF

# Start services
echo "[3/4] Starting services..."
ssh "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
cd /opt/shadowos

# Kill existing processes
pkill -f "uvicorn backend.api.main" || true
pkill -f "next start" || true

# Start backend
cd /opt/shadowos
source backend/venv/bin/activate
nohup uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 > /var/log/shadowos-backend.log 2>&1 &

# Start frontend
cd /opt/shadowos/frontend
nohup npm start > /var/log/shadowos-frontend.log 2>&1 &

echo "Services started!"
EOF

echo "[4/4] Done! Access at http://$REMOTE_HOST:3000"
