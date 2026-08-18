#!/bin/bash

# Setup NTP time synchronization on Raspberry Pi
# This ensures the system clock stays accurate for time-based features

set -e

echo "🕐 Setting up NTP time synchronization..."

# Install systemd-timesyncd if not already installed
if ! command -v timedatectl &> /dev/null; then
    echo "Installing systemd-timesyncd..."
    sudo apt-get update
    sudo apt-get install -y systemd-timesyncd
fi

# Enable and start systemd-timesyncd
echo "Enabling systemd-timesyncd service..."
sudo systemctl enable systemd-timesyncd
sudo systemctl start systemd-timesyncd

# Configure NTP servers (using Google's public NTP as fallback)
if [ ! -f /etc/systemd/timesyncd.conf.bak ]; then
    echo "Backing up original timesyncd.conf..."
    sudo cp /etc/systemd/timesyncd.conf /etc/systemd/timesyncd.conf.bak
fi

echo "Configuring NTP servers..."
sudo tee /etc/systemd/timesyncd.conf > /dev/null << 'EOF'
[Time]
NTP=time.google.com time.cloudflare.com pool.ntp.org
FallbackNTP=0.debian.pool.ntp.org 1.debian.pool.ntp.org
RootDistanceMaxSec=5
PollIntervalMinSec=32
PollIntervalMaxSec=2048
EOF

# Restart the service to apply changes
echo "Restarting systemd-timesyncd..."
sudo systemctl restart systemd-timesyncd

# Wait a moment for initial sync
sleep 3

# Show status
echo ""
echo "✅ NTP configuration complete!"
echo ""
timedatectl status
echo ""
echo "Time synchronization is now active. The system clock will stay accurate."
