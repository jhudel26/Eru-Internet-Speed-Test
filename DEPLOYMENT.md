# Deployment Guide - Render.com

## Quick Start

### Prerequisites
- GitHub account
- Render.com account (free tier available)
- Git installed on your computer

## Important: Package Setup

This project uses a simple Node.js server (`server.js`) with **no external runtime dependencies** - only devDependencies for development. This makes deployment simpler and faster.

The server uses only Node.js built-in modules (http, fs, path), so no `npm install` is needed for production, but Render will still run it for consistency.

## Step-by-Step Deployment

### 1. Prepare Your Code

Make sure all your files are ready:
- ✅ `index.html`
- ✅ `script.js`
- ✅ `styles.css`
- ✅ `input.css`
- ✅ `tailwind.config.js`
- ✅ `package.json`
- ✅ `render.yaml`
- ✅ `README.md`

### 2. Initialize Git Repository

```bash
# Navigate to your project directory
cd Eru-Internet-Speed-Test-master

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Eru Speed Test v2.0"
```

### 3. Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `eru-speed-test` (or your preferred name)
4. Description: "Professional Internet Speed Test Web Application"
5. Choose **Public** or **Private**
6. **DO NOT** check "Initialize with README" (we already have one)
7. Click "Create repository"

### 4. Push to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/eru-speed-test.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### 5. Deploy to Render.com

#### Option A: Using Render Dashboard (Recommended)

1. **Sign up/Login**:
   - Go to [Render.com](https://render.com)
   - Click "Get Started for Free"
   - Sign up with GitHub (easiest method)

2. **Create Static Site**:
   - Click "New +" button
   - Select "Static Site"
   - Click "Connect account" if GitHub isn't connected
   - Select your repository: `eru-speed-test`

3. **Configure Settings**:
   ```
   Name: eru-speed-test
   Branch: main (or master)
   Root Directory: (leave empty)
   Build Command: npm install
   Start Command: npm start
   Environment: Node
   ```

4. **Deploy**:
   - Click "Create Static Site"
   - Wait for deployment (usually 1-2 minutes)
   - Your site will be live at: `https://eru-speed-test.onrender.com`

#### Option B: Using Render Blueprint (render.yaml)

1. In Render dashboard, click "New +" → "Blueprint"
2. Connect your GitHub repository
3. Render will automatically detect `render.yaml` and configure everything
4. Click "Apply" to deploy

### 6. Verify Deployment

1. Visit your Render URL (e.g., `https://eru-speed-test.onrender.com`)
2. Test the speed test functionality
3. Check that all features work correctly

### 7. Custom Domain (Optional)

1. Go to your service in Render dashboard
2. Click "Settings" → "Custom Domains"
3. Add your domain (e.g., `speedtest.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)

## Automatic Deployments

Render automatically deploys when you push to the `main` branch:

```bash
# Make changes to your code
# ... edit files ...

# Commit changes
git add .
git commit -m "Update speed test features"

# Push to GitHub (triggers automatic deployment)
git push origin main
```

## Environment Variables

No environment variables are required for this static site.

## Troubleshooting

### Deployment Fails

1. **Check Build Logs**: Go to Render dashboard → Your service → "Logs"
2. **Verify Files**: Make sure all required files are in the repository
3. **Check render.yaml**: Ensure the configuration is correct

### Site Not Loading

1. **Check URL**: Make sure you're using the correct Render URL
2. **Clear Cache**: Try incognito/private browsing mode
3. **Check Console**: Open browser DevTools (F12) and check for errors

### Speed Test Not Working

1. **CORS Issues**: Some endpoints may have CORS restrictions
2. **Browser Console**: Check for JavaScript errors
3. **Network Tab**: Verify API calls are working

## Render.com Free Tier Limits

- ✅ 750 hours/month (enough for 24/7 operation)
- ✅ Free SSL certificate
- ✅ Automatic deployments
- ✅ Custom domains
- ⚠️ Service spins down after 15 minutes of inactivity (wakes up on first request)

## Upgrading to Paid Plan

If you need:
- No spin-down (always-on)
- More bandwidth
- Priority support

Upgrade in Render dashboard → Settings → Plan

## Support

- Render Documentation: https://render.com/docs
- Render Support: support@render.com
- GitHub Issues: Create an issue in your repository

