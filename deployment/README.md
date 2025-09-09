# Cafe Revenue Management System - Deployment Guide

## cPanel Python App Deployment

### Backend Deployment

1. In cPanel, go to "Setup Python App"
2. Create a new application with:
   - Python version: 3.8 or higher
   - Application root: `/home/username/cafe-d-revenue-main/backend`
   - Application URL: `/api` (or your preferred endpoint)
   - Application startup file: `wsgi.py`
   - Entry point: `app`

3. After creating the application, install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Upload the contents of the `dist` folder to your public HTML directory or configure your web server to serve these static files.

### Environment Variables

Set the following environment variables in your cPanel Python application:

- DATABASE_URL=postgresql://username:password@localhost:5432/databasename
- SECRET_KEY=your-super-secret-key-change-this-in-production
- ALGORITHM=HS256
- ACCESS_TOKEN_EXPIRE_MINUTES=30
- FRONTEND_URL=https://yourdomain.com
- ALLOWED_ORIGINS=https://yourdomain.com
- DEBUG=False
- LOG_LEVEL=INFO

### Database Migration

After deployment, run the database migration script:
```bash
python migrate_to_postgres.py
```