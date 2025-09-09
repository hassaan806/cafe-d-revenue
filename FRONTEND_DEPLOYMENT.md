# Frontend Deployment Guide for Cafe Revenue Management System

This guide explains how to deploy the frontend of your Cafe Revenue Management System using Node.js on hosting platforms.

## Application Overview

Your frontend is a React application built with:
- Vite as the build tool
- React for UI components
- TypeScript for type safety
- Tailwind CSS for styling

## Node.js Deployment Options

### Option 1: Static File Deployment (Recommended)
Deploy the built static files using any web server (Nginx, Apache, etc.)

### Option 2: Node.js Server Deployment
Run the frontend using Node.js with Vite's preview server

## Node.js Deployment Details

### Node.js Version
- **Minimum Required**: Node.js 14+
- **Recommended**: Node.js 16+ or 18+
- **Check Version**: `node --version`

### Application Mode
Set the environment mode:
```bash
NODE_ENV=production
```

### Application Root
The root directory is where [package.json](file:///d:/Qoder/cafe-d-revenue-main/package.json) is located.

### Application Startup File
The startup commands are defined in [package.json](file:///d:/Qoder/cafe-d-revenue-main/package.json):

1. **Build the application** (required first step):
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with static files.

2. **Serve the built application**:
   ```bash
   npm run prod
   # or
   npm run start
   # or
   npm run serve
   ```

### Environment Variables
Required environment variables:
```bash
NODE_ENV=production
PORT=3010
```

## Deployment Process

### Step 1: Prepare Application Files
Upload all project files to your server:
```
cafe-d-revenue-main/
├── dist/                 # Built files (created after build)
├── src/                  # Source code
├── public/               # Static assets
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
└── ... (other config files)
```

### Step 2: Install Dependencies
```bash
npm install --production
```

### Step 3: Build the Application
```bash
npm run build
```

### Step 4: Start the Application
```bash
npm run prod
```

## Hosting Platform Configuration

### For Platforms Using package.json Detection
Most Node.js hosting platforms will automatically:
1. Detect [package.json](file:///d:/Qoder/cafe-d-revenue-main/package.json)
2. Run `npm install`
3. Look for a `start` script in [package.json](file:///d:/Qoder/cafe-d-revenue-main/package.json)

### Platform-Specific Configuration

#### Heroku
Create a `Procfile`:
```
web: npm run prod
```

#### Render
In the web service settings:
- Build Command: `npm run build`
- Start Command: `npm run prod`

#### Vercel
Create a `vercel.json`:
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["dist/**"]
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
```

## Important Considerations

### 1. Proxy Configuration
Your frontend uses Vite's proxy to communicate with the backend:
```typescript
proxy: {
  '/api': {
    target: 'http://127.0.0.1:9000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}
```

When deploying, ensure:
- The backend is running on port 9000
- The proxy target matches your backend URL
- CORS is properly configured

### 2. Environment Variables
Update [vite.config.ts](file:///d:/Qoder/cafe-d-revenue-main/vite.config.ts) for production:
```typescript
server: {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3010,
  host: true,
  proxy: {
    '/api': {
      target: process.env.BACKEND_URL || 'http://127.0.0.1:9000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
},
```

### 3. Production vs Development
- **Development**: `npm run dev` (hot reload, development server)
- **Production**: `npm run build` + `npm run prod` (optimized static files)

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   Error: listen EADDRINUSE: address already in use
   ```
   Solution: Change the port in the startup command:
   ```bash
   PORT=8080 npm run prod
   ```

2. **Missing Dependencies**:
   ```bash
   Error: Cannot find module 'vite'
   ```
   Solution: Run `npm install` before starting

3. **Build Errors**:
   ```bash
   Build failed with errors
   ```
   Solution: Check TypeScript/JavaScript syntax errors

4. **Blank Page**:
   - Check browser console for errors
   - Verify proxy configuration
   - Ensure backend is running

### Logs and Monitoring
Check logs for:
- Application startup messages
- Error messages
- Port binding information
- Proxy connection status

## Performance Optimization

1. **Enable Gzip Compression** (if supported by your hosting platform)

2. **Set Cache Headers** for static assets:
   ```
   Cache-Control: max-age=31536000
   ```

3. **Use a CDN** for static assets if available

## Security Considerations

1. **Environment Variables**:
   - Never commit sensitive data to version control
   - Use hosting platform's environment variable management

2. **HTTPS**:
   - Always use HTTPS in production
   - Configure SSL certificates

3. **Content Security Policy**:
   - Configure appropriate CSP headers
   - Restrict external resource loading

## Support

For deployment issues:
1. Check hosting platform documentation
2. Verify all dependencies are installed
3. Ensure correct Node.js version
4. Review logs for error messages