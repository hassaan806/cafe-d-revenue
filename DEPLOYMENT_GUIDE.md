# Deployment Guide for Cafe Revenue Management System

This guide will help you deploy the Cafe Revenue Management System on Orange Hosting or similar hosting providers.

## Application Architecture Overview

This is a full-stack application with:
- **Frontend**: React + TypeScript + Vite (Static files or Node.js server)
- **Backend**: FastAPI (Python) with SQLite database
- **Communication**: Frontend makes API calls to backend via `/api` proxy

## Application Entry Point

### Development Entry Point
- **File**: [backend/start_backend.py](file:///d:/Qoder/cafe-d-revenue-main/backend/start_backend.py)
- **Usage**: `python start_backend.py`
- **Server**: Uvicorn (development server)

### Production WSGI Entry Point
- **File**: [backend/wsgi.py](file:///d:/Qoder/cafe-d-revenue-main/backend/wsgi.py)
- **WSGI Callable**: `app` object
- **Usage**: For production WSGI servers like Gunicorn

The WSGI entry point provides a standard interface for production web servers to communicate with your FastAPI application.

## Frontend Deployment Options

### Option 1: Static File Deployment (Recommended)
Deploy the built static files using any web server (Nginx, Apache, etc.)

### Option 2: Node.js Server Deployment
Run the frontend using Node.js with Vite's preview server

For detailed frontend deployment instructions, see [FRONTEND_DEPLOYMENT.md](FRONTEND_DEPLOYMENT.md)

## Deployment Options

### Option 1: Single Server Deployment (Recommended for Orange Hosting)

In this setup, both frontend and backend run on the same server:

```
Internet → [Web Server] → [Static Files + API Proxy] → [FastAPI Backend]
                        ↳ /api/* → http://localhost:9000/*
                        ↳ /* → Static React files
```

### Option 2: Separate Servers Deployment

- Frontend server hosts static React files or runs Node.js server
- Backend server runs FastAPI application
- CORS configuration needed between servers

## Requirements for Orange Hosting

### Server Specifications
- Python 3.8+
- Node.js 14+
- npm 6+
- At least 1GB RAM
- SQLite support (usually included)

### Ports
- One port for web server (e.g., 80 for HTTP, 443 for HTTPS)
- One port for backend API (e.g., 9000)

## Deployment Steps

### Step 1: Prepare Your Files

1. Build the frontend:
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with static files.

2. Upload all files to your server:
   - Backend folder with all Python files
   - `dist/` folder from frontend build
   - Database file (`cafe_revenue.db`) or initialize with scripts

### Step 2: Install Dependencies

1. Install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. For production deployment, install a WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   ```

3. Install Node.js dependencies:
   ```bash
   npm install --production
   ```

### Step 3: Configure Environment

1. Update [backend/.env](file:///d:/Qoder/cafe-d-revenue-main/backend/.env):
   ```env
   # Backend Environment Variables
   DATABASE_URL=sqlite:///./cafe_revenue.db
   SECRET_KEY=your-super-secret-key-change-this-in-production-please
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   # CORS settings - Update with your domain
   FRONTEND_URL=https://yourdomain.com
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

   # Development settings
   DEBUG=False
   LOG_LEVEL=INFO

   # SMS settings
   SMS_API_KEY=your_actual_api_key
   SMS_SENDER_ID=your_sender_id
   SMS_API_URL=https://connect.smsapp.pk/api/v3/
   ```

### Step 4: Set Up Web Server (Apache/Nginx)

#### For Apache with mod_proxy:

Create or update your virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    
    # Serve static files
    DocumentRoot /path/to/your/project/dist
    
    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:9000
    ProxyPassReverse /api http://127.0.0.1:9000
    
    # Allow access to static files
    <Directory /path/to/your/project/dist>
        Require all granted
        AllowOverride All
        Options -Indexes
    </Directory>
</VirtualHost>
```

#### For Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Serve static files
    location / {
        root /path/to/your/project/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 5: Start Services

#### Option 1: Using Uvicorn (Development)
```bash
cd backend
python start_backend.py
```

#### Option 2: Using Gunicorn (Production)
```bash
cd backend
gunicorn -w 4 -b 127.0.0.1:9000 wsgi:app
```

#### Option 3: Start Frontend (Node.js Server)
```bash
npm run prod
```

#### Option 4: Using Process Manager (Recommended for Production)

Using systemd (Linux):
Create `/etc/systemd/system/cafe-backend.service`:
```ini
[Unit]
Description=Cafe Revenue Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/project/backend
ExecStart=/path/to/your/project/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:9000 wsgi:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/cafe-frontend.service`:
```ini
[Unit]
Description=Cafe Revenue Frontend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/project
ExecStart=/usr/bin/npm run prod
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable cafe-backend
sudo systemctl enable cafe-frontend
sudo systemctl start cafe-backend
sudo systemctl start cafe-frontend
```

### Step 6: Initialize Database (If Needed)

If starting with a fresh database:
```bash
python init_db.py
python add_admin_user.py
```

### Step 7: Configure SSL (Recommended)

Use Let's Encrypt for free SSL certificates:
```bash
sudo certbot --apache -d yourdomain.com  # For Apache
# or
sudo certbot --nginx -d yourdomain.com   # For Nginx
```

## Orange Hosting Specific Instructions

### If Using Shared Hosting:

1. Check if Orange Hosting supports:
   - Python applications
   - Node.js applications
   - Custom .htaccess rules
   - Background processes

2. You might need to use a process manager like `supervisor` or `pm2` to keep the backend running.

### If Using VPS:

1. You have full control over:
   - Installing required software
   - Configuring web servers
   - Managing processes

2. Follow the steps above for complete control.

## Process Management

To keep your backend running after SSH logout:

### Option 1: Using nohup
```bash
cd backend
nohup gunicorn -w 4 -b 127.0.0.1:9000 wsgi:app > backend.log 2>&1 &
```

### Option 2: Using screen
```bash
screen -S cafe-backend
cd backend
gunicorn -w 4 -b 127.0.0.1:9000 wsgi:app
# Press Ctrl+A, then D to detach
```

### Option 3: Using systemd (Linux)
(See above in Step 5)

## Monitoring and Maintenance

### Logs
- Backend logs: Check `backend.log` if using nohup
- Frontend logs: Check systemd logs or process output
- Web server logs: `/var/log/apache2/` or `/var/log/nginx/`
- Application logs: Configure in FastAPI if needed

### Updates
1. Pull latest code
2. Install/update dependencies
3. Restart backend and frontend services
4. Reload web server

### Backups
Regularly backup:
- Database file: `backend/cafe_revenue.db`
- Configuration files
- Customizations

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**:
   - Backend service not running
   - Port mismatch in proxy configuration
   - Firewall blocking connections

2. **404 Not Found**:
   - Incorrect document root
   - Missing static files
   - Routing issues in React app

3. **CORS Errors**:
   - Incorrect ALLOWED_ORIGINS in backend config
   - Proxy not working correctly

4. **Database Connection Issues**:
   - Incorrect DATABASE_URL
   - File permissions on database file
   - Database locked

### Debugging Steps

1. Check if backend is running:
   ```bash
   curl http://127.0.0.1:9000/health
   ```

2. Check if frontend is running:
   ```bash
   curl http://127.0.0.1:3010
   ```

3. Check web server configuration:
   - Verify document root points to `dist/` folder
   - Confirm proxy settings

4. Check logs:
   - Backend logs
   - Frontend logs
   - Web server error logs

## Security Considerations

1. Change the SECRET_KEY in [backend/.env](file:///d:/Qoder/cafe-d-revenue-main/backend/.env)
2. Set DEBUG=False in production
3. Use HTTPS only
4. Restrict database file permissions
5. Regular security updates for dependencies

## Performance Optimization

1. Use a production WSGI server like Gunicorn instead of uvicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 127.0.0.1:9000 wsgi:app
   ```

2. Enable caching for static files
3. Use a CDN for images and assets
4. Optimize database queries

## Support

For issues with deployment:
1. Check all configuration files
2. Verify file permissions
3. Ensure all dependencies are installed
4. Review logs for error messages