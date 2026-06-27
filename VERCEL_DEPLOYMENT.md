# Vercel Deployment Guide

## ⚠️ Important: Deployment Issue Fix

The original approach used a custom Node.js HTTP server (`server.js`), which doesn't work well with Vercel's architecture. I've created Vercel-compatible serverless functions to fix this.

## New Vercel-Compatible Structure

### Serverless Functions (API Routes)
- `api/save.js` - Save speed test results
- `api/results/[id].js` - Fetch results by ID  
- `api/og.js` - Generate OG images
- `api/share.js` - Serve share pages

### Configuration
- `vercel.json` - Routes `/share/*` to serverless function
- Static files (`index.html`, `share.html`, etc.) served automatically

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Vercel-compatible sharing functionality"
git push
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will auto-detect the project structure
4. Click "Deploy"

### 3. Verify Deployment
- Main site: `https://your-project.vercel.app/`
- API should work: `https://your-project.vercel.app/api/save`
- Share links: `https://your-project.vercel.app/share/abc123`

## How It Works on Vercel

### Local Development
- Use `npm start` to run the custom Node.js server
- Full functionality including custom routes

### Vercel Production
- Static files served automatically by Vercel
- API routes handled by serverless functions in `/api` directory
- `/share/*` routes rewritten to `/api/share` function

## Key Differences

### Before (Custom Server)
- Single `server.js` handled all routes
- Custom routing logic
- File serving manually implemented

### After (Vercel Functions)
- Static files served by Vercel automatically
- API routes as separate serverless functions
- Vercel handles routing via `vercel.json`

## Testing

### Local Testing
```bash
npm start
# Visit http://localhost:10000/test-api.html
```

### Vercel Testing
After deployment, test:
1. Run a speed test on your deployed site
2. Click "Share" button
3. Copy the share link
4. Test the share link in a new browser
5. Check OG image: `https://your-project.vercel.app/api/og?result=ID`

## Troubleshooting

### "File Not Found" Error
- **Cause**: Vercel couldn't find the entry point
- **Fix**: Ensure `vercel.json` is in the root directory
- **Fix**: Make sure `index.html` exists in the root

### API Routes Not Working
- **Cause**: Serverless functions not properly configured
- **Fix**: Check files are in `/api` directory
- **Fix**: Ensure they export default handler functions

### Share Links Not Working
- **Cause**: Rewrite rule not matching
- **Fix**: Check `vercel.json` has correct rewrite rule
- **Fix**: Test API directly: `/api/share?id=test`

### OG Images Not Generating
- **Cause**: Function error or data not found
- **Fix**: Check results are being saved
- **Fix**: Test OG endpoint directly with valid ID

## File Structure for Vercel

```
├── api/
│   ├── save.js              # Save results
│   ├── results/
│   │   └── [id].js         # Fetch results
│   ├── og.js               # Generate OG image
│   └── share.js            # Serve share pages
├── index.html              # Main app
├── share.html              # Share template
├── script.js               # Client logic
├── styles.css              # Styles
├── server.js               # Local development only
├── vercel.json             # Vercel configuration
├── package.json            # Dependencies
└── results.json            # Data (gitignored)
```

## Notes

- `server.js` is only used for local development
- Vercel ignores `server.js` in production
- `results.json` is gitignored (created on first deployment)
- Serverless functions have execution time limits
- For production, consider using a real database

## Social Media Preview Testing

After deployment, test your OG images:

1. **Facebook**: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. **Twitter**: [Card Validator](https://cards-dev.twitter.com/validator)
3. **LinkedIn**: [Post Inspector](https://www.linkedin.com/post-inspector/)

Enter your share URL to see how it will appear when shared.