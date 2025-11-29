# Eru Internet Speed Test

A modern, professional internet speed test web application with accurate measurements and beautiful UI.

## Features

- **Accurate Speed Testing**: Optimized algorithms for download, upload, ping, and jitter measurement
- **Modern UI**: Glass morphism design with smooth animations
- **Responsive Design**: Works perfectly on all screen sizes
- **Real-time Progress**: Live updates during tests
- **Connection Info**: Displays IP, ISP, server location
- **No Dependencies**: Pure vanilla JavaScript

## Deployment

### Render.com (Recommended)

#### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Eru Speed Test v2.0"
   ```

2. **Create a GitHub Repository**:
   - Go to [GitHub](https://github.com/new)
   - Create a new repository (e.g., `eru-speed-test`)
   - **Don't** initialize with README, .gitignore, or license (we already have these)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/eru-speed-test.git
   git branch -M main
   git push -u origin main
   ```

#### Step 2: Deploy to Render.com

1. **Sign up/Login to Render**:
   - Go to [Render.com](https://render.com)
   - Sign up or log in (you can use your GitHub account)

2. **Create New Static Site**:
   - Click "New +" → "Static Site"
   - Connect your GitHub account if not already connected
   - Select your repository (`eru-speed-test`)

3. **Configure Deployment**:
   - **Name**: `eru-speed-test` (or your preferred name)
   - **Branch**: `main` (or `master`)
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: Leave empty (no build needed)
   - **Publish Directory**: Leave empty (uses root)
   - **Environment**: `Static Site`

4. **Deploy**:
   - Click "Create Static Site"
   - Render will automatically deploy your site
   - Your site will be available at `https://eru-speed-test.onrender.com` (or your custom domain)

#### Step 3: Custom Domain (Optional)

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain and follow DNS configuration instructions

#### Automatic Deployments

- **Automatic**: Every push to `main` branch triggers a new deployment
- **Manual**: You can manually deploy from the Render dashboard

The `render.yaml` file is included for automatic configuration when using Render's Blueprint feature.

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Netlify

Simply drag and drop the folder or connect via Git.

## Performance Optimizations

- Optimized upload test with adaptive chunk sizing
- Multiple parallel connections for accurate measurement
- Speed sample averaging for stable results
- Efficient memory usage
- GPU-accelerated animations

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

MIT License
