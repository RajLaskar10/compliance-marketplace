#!/bin/bash
# EC2 Bootstrap Script — Amazon Linux 2023
# Run this after SSH-ing into your EC2 instance

# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install nginx
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install git
sudo yum install -y git

# Clone repo
cd /home/ec2-user
git clone https://github.com/RajLaskar10/compliance-marketplace.git
cd compliance-marketplace/server
npm install

# Copy your .env file (do this manually via scp or AWS Secrets Manager)
# scp .env ec2-user@your-ec2-ip:/home/ec2-user/compliance-marketplace/server/.env

# Start backend with PM2
pm2 start npm --name "compliance-api" -- start
pm2 startup
pm2 save

# Configure nginx reverse proxy
sudo tee /etc/nginx/conf.d/compliance.conf > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain-or-ec2-ip;

    client_max_body_size 10M;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo nginx -t
sudo systemctl reload nginx

echo "EC2 setup complete. Backend running on port 5000 via nginx."
