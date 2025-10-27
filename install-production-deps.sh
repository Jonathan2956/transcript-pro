#!/bin/bash

# TranscriptPro Production Dependencies Installation Script
# यह script production environment के लिए सभी necessary dependencies install करता है

echo "🚀 Starting TranscriptPro Production Setup..."
echo "=============================================="

# System Updates
echo "📦 Updating system packages..."
sudo apt update -y
sudo apt upgrade -y

# Node.js Installation (यदि नहीं installed है)
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Python and pip Installation (yt-dlp के लिए)
echo "🐍 Installing Python and pip..."
sudo apt install -y python3 python3-pip

# yt-dlp Installation (YouTube captions extraction के लिए)
echo "🎬 Installing yt-dlp for caption extraction..."
pip3 install yt-dlp

# FFmpeg Installation (Audio/video processing के लिए)
echo "🎵 Installing FFmpeg..."
sudo apt install -y ffmpeg

# PM2 Installation (Process management के लिए)
echo "⚡ Installing PM2 for process management..."
sudo npm install -g pm2

# Nginx Installation (Reverse proxy के लिए)
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# SSL Certificates (Let's Encrypt)
echo "🔒 Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# Backend Dependencies
echo "📚 Installing backend dependencies..."
cd backend
npm install --production

# Frontend Dependencies (यदि React/Vue use कर रहे हैं)
echo "🎨 Installing frontend dependencies..."
cd ../frontend
npm install --production
npm run build

# PM2 Startup Configuration
echo "🔧 Configuring PM2 startup..."
pm2 startup
pm2 save

# Directory Permissions
echo "📁 Setting up directory permissions..."
sudo chown -R $USER:$USER /var/www/transcriptpro
sudo chmod -R 755 /var/www/transcriptpro

# Firewall Configuration
echo "🛡️ Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo ""
echo "✅ Production setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Configure environment variables in backend/.env"
echo "2. Set up Nginx configuration"
echo "3. Obtain SSL certificates"
echo "4. Start application with: pm2 start ecosystem.config.js"
echo ""
echo "📝 Configuration files location:"
echo "   - Nginx: /etc/nginx/sites-available/transcriptpro"
echo "   - PM2: /home/$(whoami)/.pm2"
echo "   - Logs: /home/$(whoami)/.pm2/logs"
echo ""
echo "🔗 Default URL: https://your-domain.com"
