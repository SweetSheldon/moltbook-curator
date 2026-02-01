#!/bin/bash

# First-time server setup for Hetzner
# Run this ONCE on your server: bash setup-server.sh

set -e

echo "=== Moltbook Curator Server Setup ==="

# Install Node.js 20
echo "[1/5] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
echo "[2/5] Installing PM2..."
sudo npm install -g pm2

# Create app directory
echo "[3/5] Creating app directory..."
sudo mkdir -p /var/www/moltbook-curator
sudo chown $USER:$USER /var/www/moltbook-curator

# Clone repository
echo "[4/5] Cloning repository..."
cd /var/www
git clone git@github.com:SweetSheldon/moltbook-curator.git moltbook-curator || {
    echo "Using HTTPS instead..."
    git clone https://github.com/SweetSheldon/moltbook-curator.git moltbook-curator
}

# Install and build
echo "[5/5] Installing dependencies and building..."
cd moltbook-curator
npm ci
npm run build

# Start with PM2
pm2 start dist/main.js --name moltbook-curator
pm2 save
pm2 startup

echo ""
echo "=== Setup Complete ==="
echo "App running on port 3000"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart app"
