#!/bin/bash
# Deployment script for Cafe Revenue Management System

echo "=== Cafe Revenue Management System Deployment ==="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

echo "Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "Error: Frontend build failed"
    exit 1
fi

echo "Frontend build completed successfully"

echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt

# Install production WSGI server
echo "Installing Gunicorn for production deployment..."
pip install gunicorn

if [ $? -ne 0 ]; then
    echo "Error: Failed to install backend dependencies"
    exit 1
fi

echo "Backend dependencies installed successfully"

echo "Creating production environment file..."
cat > .env.production << EOF
# Production Environment Variables
DATABASE_URL=sqlite:///./cafe_revenue.db
SECRET_KEY=your-super-secret-key-change-this-in-production-please
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS settings - Update with your domain
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Production settings
DEBUG=False
LOG_LEVEL=INFO

# SMS settings
SMS_API_KEY=your_actual_api_key
SMS_SENDER_ID=your_sender_id
SMS_API_URL=https://connect.smsapp.pk/api/v3/
EOF

echo "Environment file created. Please update it with your production values."

echo "Deployment preparation completed!"
echo ""
echo "Next steps:"
echo "1. Upload the dist/ folder and backend folder to your server"
echo "2. Configure your web server (Apache/Nginx) with proxy settings"
echo "3. Update the .env.production file with your production values"
echo "4. Start the backend service using Gunicorn:"
echo "   cd backend && gunicorn -w 4 -b 127.0.0.1:9000 wsgi:app"
echo "5. Ensure your web server is serving the static files from dist/"
echo ""
echo "For detailed deployment instructions, see DEPLOYMENT_GUIDE.md"