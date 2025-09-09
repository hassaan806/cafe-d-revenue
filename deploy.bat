@echo off
REM Deployment script for Cafe Revenue Management System

echo === Cafe Revenue Management System Deployment ===

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "backend" (
    echo Error: Please run this script from the project root directory
    pause
    exit /b 1
)

echo Building frontend...
npm run build

if %errorlevel% neq 0 (
    echo Error: Frontend build failed
    pause
    exit /b 1
)

echo Frontend build completed successfully

echo Installing backend dependencies...
cd backend
pip install -r requirements.txt

REM Install production WSGI server
echo Installing Gunicorn for production deployment...
pip install gunicorn

if %errorlevel% neq 0 (
    echo Error: Failed to install backend dependencies
    pause
    exit /b 1
)

echo Backend dependencies installed successfully

echo Creating production environment file...
echo # Production Environment Variables > .env.production
echo DATABASE_URL=sqlite:///./cafe_revenue.db >> .env.production
echo SECRET_KEY=your-super-secret-key-change-this-in-production-please >> .env.production
echo ALGORITHM=HS256 >> .env.production
echo ACCESS_TOKEN_EXPIRE_MINUTES=30 >> .env.production
echo. >> .env.production
echo # CORS settings - Update with your domain >> .env.production
echo FRONTEND_URL=https://yourdomain.com >> .env.production
echo ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com >> .env.production
echo. >> .env.production
echo # Production settings >> .env.production
echo DEBUG=False >> .env.production
echo LOG_LEVEL=INFO >> .env.production
echo. >> .env.production
echo # SMS settings >> .env.production
echo SMS_API_KEY=your_actual_api_key >> .env.production
echo SMS_SENDER_ID=your_sender_id >> .env.production
echo SMS_API_URL=https://connect.smsapp.pk/api/v3/ >> .env.production

echo Environment file created. Please update it with your production values.

echo Deployment preparation completed!
echo.
echo Next steps:
echo 1. Upload the dist/ folder and backend folder to your server
echo 2. Configure your web server (Apache/Nginx) with proxy settings
echo 3. Update the .env.production file with your production values
echo 4. Start the backend service using Gunicorn:
echo    cd backend && gunicorn -w 4 -b 127.0.0.1:9000 wsgi:app
echo 5. Ensure your web server is serving the static files from dist/
echo.
echo For detailed deployment instructions, see DEPLOYMENT_GUIDE.md
echo.
pause