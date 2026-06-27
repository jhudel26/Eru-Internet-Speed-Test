# Vercel Deployment Guide with Upstash Redis

## Prerequisites
- Node.js 18+ installed
- Vercel account (free tier works)
- Upstash Redis account (you already have the credentials)
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Project

### 1.1 Create a Git Repository
```bash
cd "C:\Users\jhude\Downloads\Compressed\1Eru-Internet-Speed-Test-master\Eru-Internet-Speed-Test-master"
git init
git add .
git commit -m "Initial commit with Upstash Redis integration"
```

### 1.2 Push to GitHub
1. Create a new repository on GitHub
2. Add remote and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/eru-speed-test.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Follow the prompts:**
   - Set up and deploy? → `Y`
   - Which scope? → Select your account
   - Link to existing project? → `N`
   - Project name → `eru-speed-test` (or your preferred name)
   - In which directory is your code located? → `./`
   - Want to override the settings? → `N`

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project settings
5. Click "Deploy"

## Step 3: Configure Environment Variables

### In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

```
KV_REST_API_URL = https://stable-feline-97340.upstash.io
KV_REST_API_TOKEN = gQAAAAAAAXw8AAIgcDEzYzYzOTdkMjE5Yjk0NmMzYjhmMjJhNTZlYTU1ZWVhOQ
KV_REST_API_READ_ONLY_TOKEN = ggAAAAAAAXw8AAIgcDFtD2poMKaJH6kJnweDL5myx9gqczr6685uoVd6UGZEmw
KV_URL = rediss://default:gQAAAAAAAXw8AAIgcDEzYzYzOTdkMjE5Yjk0NmMzYjhmMjJhNTZlYTU1ZWVhOQ@stable-feline-97340.upstash.io:6379
REDIS_URL = rediss://default:gQAAAAAAAXw8AAIgcDEzYzYzOTdkMjE5Yjk0NmMzYjhmMjJhNTZlYTU1ZWVhOQ@stable-feline-97340.upstash.io:6379
```

### Using Vercel CLI:
```bash
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add KV_REST_API_READ_ONLY_TOKEN
vercel env add KV_URL
vercel env add REDIS_URL
```

## Step 4: Verify Deployment

1. **Check deployment logs** in Vercel dashboard
2. **Test the application** by visiting your Vercel URL
3. **Run a speed test** to verify functionality
4. **Test image sharing** by uploading a result image

## Step 5: Domain Configuration (Optional)

### Custom Domain:
1. Go to project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Troubleshooting

### Common Issues:

1. **Redis Connection Error**
   - Verify environment variables are set correctly
   - Check Upstash Redis is accessible
   - Ensure tokens are valid

2. **Build Errors**
   - Check Node.js version (must be 18+)
   - Verify all dependencies are installed
   - Check Vercel build logs

3. **Image Upload Fails**
   - Ensure Redis is connected
   - Check API endpoint is accessible
   - Verify image data format

### Local Testing:
```bash
# Install dependencies
npm install

# Set environment variables locally
# Create .env file with your credentials

# Run locally
npm start
```

## Project Structure

```
eru-internet-speed-test/
├── server.js              # Main server with Upstash integration
├── script.js              # Frontend speed test logic
├── index.html             # Main HTML file
├── package.json           # Dependencies
├── vercel.json            # Vercel configuration
├── .env.example           # Environment variables template
└── DEPLOYMENT_GUIDE.md    # This file
```

## Features Enabled

✅ Speed test with download/upload measurements
✅ Image generation for results
✅ Upstash Redis image storage
✅ Facebook Open Graph integration
✅ Twitter Card support
✅ 7-day image expiration
✅ Fallback to local download
✅ Vercel Analytics
✅ Responsive design

## Support

For issues with:
- **Vercel**: https://vercel.com/docs
- **Upstash**: https://upstash.com/docs
- **This project**: Check GitHub issues or create new one

## Next Steps

1. Deploy to Vercel using the guide above
2. Test all functionality
3. Share your speed test results on social media
4. Monitor usage in Vercel dashboard
5. Check Upstash Redis usage