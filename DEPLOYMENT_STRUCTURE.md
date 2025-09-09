# Deployment Structure

This document explains the directory structure and files organized for cPanel deployment.

## Directory Organization

```
cafe-d-revenue-main/
├── backend/                    # Python FastAPI backend application
│   ├── app/                    # Main application code
│   │   ├── api/                # API endpoints
│   │   ├── core/               # Core configuration
│   │   ├── db/                 # Database utilities
│   │   ├── models/             # Database models
│   │   └── utils/              # Utility functions
│   ├── requirements.txt        # Python dependencies
│   ├── passenger_wsgi.py      # cPanel WSGI entry point (required)
│   ├── cpanel_start.py        # cPanel-specific startup script
│   ├── cpanel_config.py       # cPanel configuration
│   ├── init_mysql_db.py       # MySQL database initialization
│   ├── migrate_to_mysql.py    # MySQL migration script
│   └── start_backend.py       # Development startup script
├── src/                       # React frontend source code
├── public/                    # Public assets
├── deployment/                # Deployment resources
│   ├── README.md              # Deployment instructions
│   └── cpanel_config.json     # cPanel configuration template
├── dist/                      # Built frontend (created during build process)
├── DEPLOYMENT_GUIDE.md        # Comprehensive deployment guide
├── DEPLOYMENT_STRUCTURE.md    # This file
├── deploy_cpanel.py          # Deployment preparation script
├── build_frontend.py         # Frontend build script
├── verify_deployment.py      # Deployment verification script
├── package.json              # Frontend dependencies and scripts
├── vite.config.ts            # Vite configuration
└── .env.example             # Environment variables template
```

## Key Files for cPanel Deployment

### Backend Files

1. **[backend/requirements.txt](file:///D:/Qoder/cafe-d-revenue-main/backend/requirements.txt)** - Python dependencies required for the backend
2. **[backend/passenger_wsgi.py](file:///D:/Qoder/cafe-d-revenue-main/backend/passenger_wsgi.py)** - cPanel WSGI entry point (required for cPanel)
3. **[backend/cpanel_start.py](file:///D:/Qoder/cafe-d-revenue-main/backend/cpanel_start.py)** - cPanel-specific startup script
4. **[backend/cpanel_config.py](file:///D:/Qoder/cafe-d-revenue-main/backend/cpanel_config.py)** - cPanel configuration settings
5. **[backend/init_mysql_db.py](file:///D:/Qoder/cafe-d-revenue-main/backend/init_mysql_db.py)** - MySQL database initialization script
6. **[backend/migrate_to_mysql.py](file:///D:/Qoder/cafe-d-revenue-main/backend/migrate_to_mysql.py)** - MySQL migration script

### Frontend Files

1. **[package.json](file:///D:/Qoder/cafe-d-revenue-main/package.json)** - Frontend dependencies and build scripts
2. **[vite.config.ts](file:///D:/Qoder/cafe-d-revenue-main/vite.config.ts)** - Vite configuration with proxy settings
3. **[src/](file:///D:/Qoder/cafe-d-revenue-main/src/)** - Source code for React frontend

### Deployment Scripts

1. **[deploy_cpanel.py](file:///D:/Qoder/cafe-d-revenue-main/deploy_cpanel.py)** - Prepares the application for cPanel deployment
2. **[build_frontend.py](file:///D:/Qoder/cafe-d-revenue-main/build_frontend.py)** - Builds the frontend for production
3. **[verify_deployment.py](file:///D:/Qoder/cafe-d-revenue-main/verify_deployment.py)** - Verifies deployment readiness

## cPanel Configuration

When setting up the Python application in cPanel, use these settings:

- **Application root**: Path to the `backend` directory
- **Application URL**: `/api` (or your preferred endpoint)
- **Application startup file**: `passenger_wsgi.py`
- **Entry point**: `application`

## Environment Variables

Set these environment variables in cPanel:

```
DATABASE_URL=mysql://cafedrev_cafedrev:cafedrevenue@localhost:3306/cafedrev_database
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=https://staging.cafedrev.com
ALLOWED_ORIGINS=https://staging.cafedrev.com,https://www.staging.cafedrev.com
DEBUG=False
LOG_LEVEL=INFO
```

## MySQL Database Configuration

The application is configured to use MySQL with:
- **Database Name**: cafedrev_database
- **Username**: cafedrev_cafedrev
- **Password**: cafedrevenue
- **Host**: localhost
- **Port**: 3306

## Deployment Workflow

1. **Prepare**: Run `python deploy_cpanel.py`
2. **Verify**: Run `python verify_deployment.py`
3. **Build Frontend**: Run `python build_frontend.py`
4. **Upload**: Upload files to cPanel
5. **Configure**: Set up Python application and environment variables in cPanel
6. **Initialize Database**: Run `python init_mysql_db.py`
7. **Install Dependencies**: Run `pip install -r requirements.txt` in cPanel
8. **Deploy**: Restart the application in cPanel

This structure ensures that your Cafe Revenue Management System can be easily deployed on cPanel with Python application support and MySQL database.