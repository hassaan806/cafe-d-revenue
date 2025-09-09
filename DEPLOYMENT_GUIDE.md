# Cafe Revenue Management System - Deployment Guide

## Overview

This guide provides instructions for deploying the Cafe Revenue Management System on cPanel with Python application support. The system consists of:

1. **Backend**: Python FastAPI application
2. **Frontend**: React + TypeScript application

## Prerequisites

- cPanel account with Python application support
- Python 3.8 or higher
- Node.js 14+ for frontend build
- MySQL database (configured with database name "cafedrev_database", username "cafedrev_cafedrev", password "cafedrevenue")

## Directory Structure

```
cafe-d-revenue-main/
├── backend/                 # Python FastAPI backend
│   ├── app/                 # Application source code
│   ├── requirements.txt     # Python dependencies
│   ├── passenger_wsgi.py   # cPanel WSGI entry point
│   ├── cpanel_start.py     # cPanel startup script
│   └── cpanel_config.py    # cPanel configuration
├── src/                    # React frontend source
├── public/                 # Public assets
├── dist/                   # Built frontend (created during build)
├── deployment/             # Deployment resources
└── deploy_cpanel.py       # Deployment preparation script
```

## Backend Deployment on cPanel

### 1. Upload Files

Upload the entire project directory to your cPanel account using File Manager or FTP.

### 2. Set Up Python Application

1. Log in to your cPanel
2. Navigate to "Setup Python App" (or "Python Applications")
3. Click "Create Application"
4. Configure the application:
   - **Python version**: 3.8 or higher
   - **Application root**: `/home/username/path/to/cafe-d-revenue-main/backend`
   - **Application URL**: `/api` (or your preferred endpoint)
   - **Application startup file**: `passenger_wsgi.py`
   - **Entry point**: `application`

### 3. Install Dependencies

In the cPanel Python application interface:

1. Click on your application
2. In the virtual environment section, run:
   ```bash
   pip install -r requirements.txt
   ```

### 4. Configure Environment Variables

In the cPanel Python application interface, add the following environment variables:

```
DATABASE_URL=mysql://cafedrev_cafedrev:cafedrevenue@localhost:3306/cafedrev_database
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=https://staging.cafedrev.com
ALLOWED_ORIGINS=https://staging.cafedrev.com,https://www.staging.cafedrev.com
DEBUG=False
LOG_LEVEL=INFO
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=your_sender_id
SMS_API_URL=your_sms_api_url
```

### 5. Initialize Database

SSH into your cPanel account or use the Python application shell to run:

```bash
python init_mysql_db.py
```

Or if you need to migrate from an existing SQLite database:

```bash
python migrate_to_mysql.py
```

## Frontend Deployment

### 1. Build the Frontend

On your local machine or build server:

```bash
npm install
npm run build
```

This will create a `dist/` directory with the built frontend files.

### 2. Upload Frontend Files

Upload the contents of the `dist/` directory to your public HTML directory:
`/home/username/public_html/` (or your domain's public directory)

### 3. Configure API Proxy

The frontend is configured to proxy API requests to `/api`. Ensure your web server is configured to proxy these requests to your backend application.

For Apache, you might add this to your `.htaccess`:

```apache
# Proxy API requests to the backend
RewriteEngine On
RewriteRule ^api/(.*)$ http://127.0.0.1:9000/$1 [P,L]
```

## Environment Configuration

### Production Environment Variables

Create a `.env` file in your backend directory with:

```env
# Database
DATABASE_URL=mysql://cafedrev_cafedrev:cafedrevenue@localhost:3306/cafedrev_database

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS settings
FRONTEND_URL=https://staging.cafedrev.com
ALLOWED_ORIGINS=https://staging.cafedrev.com,https://www.staging.cafedrev.com

# Production settings
DEBUG=False
LOG_LEVEL=INFO

# SMS settings
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=your_sender_id
SMS_API_URL=your_sms_api_url
```

## Starting the Application

### Backend

The backend will automatically start when you configure it in cPanel. You can restart it from the cPanel Python application interface.

### Frontend

The frontend is served as static files from your public HTML directory.

## Troubleshooting

### Common Issues

1. **500 Internal Server Error**: Check the cPanel error logs and ensure all dependencies are installed.

2. **CORS Errors**: Verify that `FRONTEND_URL` and `ALLOWED_ORIGINS` environment variables are correctly set.

3. **Database Connection Issues**: Ensure your `DATABASE_URL` is correct and the database is accessible.

4. **Module Not Found Errors**: Make sure all dependencies are installed in the virtual environment.

### Logs

Check logs in:
- cPanel error logs
- Application logs (configured via LOG_LEVEL)
- Browser developer console for frontend issues

## Maintenance

### Updating the Application

1. Upload new files
2. Install any new dependencies: `pip install -r requirements.txt`
3. Restart the Python application from cPanel

### Database Migrations

If you update the database schema, run the appropriate migration scripts.

## Support

For issues with deployment, contact your hosting provider's support team or refer to the cPanel documentation.