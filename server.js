const fs = require('fs');
const path = require('path');
const { createClient } = require('@upstash/redis');

// Initialize Upstash Redis client
let redis;
let redisConnected = false;

async function initializeRedis() {
  try {
    redis = createClient({
      url: process.env.KV_REST_API_URL || 'https://stable-feline-97340.upstash.io',
      token: process.env.KV_REST_API_TOKEN || 'gQAAAAAAAXw8AAIgcDEzYzYzOTdkMjE5Yjk0NmMzYjhmMjJhNTZlYTU1ZWVhOQ'
    });
    await redis.connect();
    redisConnected = true;
    console.log('Connected to Upstash Redis');
  } catch (error) {
    console.error('Failed to connect to Upstash Redis:', error);
    console.log('Image upload functionality will be disabled');
    redis = null;
    redisConnected = false;
  }
}

// Initialize Redis asynchronously
initializeRedis();

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Handle API requests
  if (req.url.startsWith('/api/')) {
    await handleAPIRequest(req, res);
    return;
  }
  
  // Handle shared result links
  const url = new URL(req.url, `http://${req.headers.host}`);
  const resultId = url.searchParams.get('result');
  
  if (resultId) {
    await handleSharedResult(req, res, resultId, url);
    return;
  }
  
  // Serve static files
  let filePath = '.' + decodeURIComponent(req.url.split('?')[0]);
  
  // Default to index.html
  if (filePath === './' || filePath === '.') {
    filePath = './index.html';
  }
  
  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = getContentType(ext);
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found, try index.html
        if (filePath !== './index.html') {
          fs.readFile('./index.html', (err, content) => {
            if (err) {
              console.error('File not found:', filePath);
              res.writeHead(404);
              res.end('File Not Found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content, 'utf-8');
            }
          });
        } else {
          console.error('Index.html not found');
          res.writeHead(404);
          res.end('File Not Found');
        }
      } else {
        console.error('Server error:', error);
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
};

function getContentType(ext) {
  const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  return MIME_TYPES[ext] || 'application/octet-stream';
}

async function handleAPIRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // Check if Redis is available and connected
  if (!redis || !redisConnected) {
    res.writeHead(503);
    res.end(JSON.stringify({ error: 'Redis connection not available' }));
    return;
  }
  
  try {
    if (pathname === '/api/upload-image' && req.method === 'POST') {
      await handleImageUpload(req, res);
    } else if (pathname.startsWith('/api/image/') && req.method === 'GET') {
      await handleImageGet(req, res, url);
    } else if (pathname === '/api/share-data' && req.method === 'GET') {
      await handleShareData(req, res, url);
    } else {
      res.writeHead(404);
      res.end('API endpoint not found');
    }
  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

async function handleSharedResult(req, res, resultId, url) {
  try {
    // Check if the result exists in Redis
    const metadataKey = `speedtest:metadata:${resultId}`;
    const metadata = await redis.get(metadataKey);
    
    if (!metadata) {
      // Result not found or expired, serve normal index.html
      fs.readFile('./index.html', (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('File Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        }
      });
      return;
    }
    
    // Result exists, serve index.html with dynamic Open Graph tags
    fs.readFile('./index.html', (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('File Not Found');
        return;
      }
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const imageUrl = `${protocol}://${host}/api/image/${resultId}`;
      const shareUrl = `${protocol}://${host}/?result=${resultId}`;
      
      // Update Open Graph meta tags
      let htmlContent = content.toString();
      
      // Replace the og:image meta tag
      htmlContent = htmlContent.replace(
        /<meta property="og:image" content="">/,
        `<meta property="og:image" content="${imageUrl}">`
      );
      
      // Replace the og:url meta tag
      htmlContent = htmlContent.replace(
        /<meta property="og:url" content="">/,
        `<meta property="og:url" content="${shareUrl}">`
      );
      
      // Replace the twitter:image meta tag
      htmlContent = htmlContent.replace(
        /<meta name="twitter:image" content="">/,
        `<meta name="twitter:image" content="${imageUrl}">`
      );
      
      // Update description to include result info
      const metadataObj = JSON.parse(metadata);
      htmlContent = htmlContent.replace(
        /<meta property="og:description" content="[^"]*">/,
        `<meta property="og:description" content="Check out my internet speed test results! Download: ${metadataObj.downloadSpeed || 'N/A'} Mbps, Upload: ${metadataObj.uploadSpeed || 'N/A'} Mbps">`
      );
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(htmlContent, 'utf-8');
    });
  } catch (error) {
    console.error('Shared result error:', error);
    // Fallback to normal index.html
    fs.readFile('./index.html', (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('File Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
      }
    });
  }
}

async function handleAPIRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // Check if Redis is available and connected
  if (!redis || !redisConnected) {
    res.writeHead(503);
    res.end(JSON.stringify({ error: 'Redis connection not available' }));
    return;
  }
  
  try {
    if (pathname === '/api/upload-image' && req.method === 'POST') {
      await handleImageUpload(req, res);
    } else if (pathname.startsWith('/api/image/') && req.method === 'GET') {
      await handleImageGet(req, res, url);
    } else if (pathname === '/api/share-data' && req.method === 'GET') {
      await handleShareData(req, res, url);
    } else {
      res.writeHead(404);
      res.end('API endpoint not found');
    }
  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

async function handleImageUpload(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const { imageData, resultId, metadata } = JSON.parse(body);
      
      if (!imageData || !resultId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }
      
      // Store image data in Redis with expiration (7 days)
      const key = `speedtest:image:${resultId}`;
      await redis.set(key, imageData, { ex: 604800 }); // 7 days
      
      // Store metadata with speed test results
      const metadataKey = `speedtest:metadata:${resultId}`;
      await redis.set(metadataKey, JSON.stringify({
        ...metadata,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 604800000).toISOString()
      }), { ex: 604800 });
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        resultId,
        imageUrl: `${protocol}://${host}/api/image/${resultId}`,
        shareUrl: `${protocol}://${host}/?result=${resultId}`
      }));
    } catch (error) {
      console.error('Image upload error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to upload image' }));
    }
  });
}

async function handleImageGet(req, res, url) {
  const resultId = url.pathname.split('/').pop();
  
  try {
    const key = `speedtest:image:${resultId}`;
    const imageData = await redis.get(key);
    
    if (!imageData) {
      res.writeHead(404);
      res.end('Image not found or expired');
      return;
    }
    
    // Parse data URL to get the actual image data
    const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      res.writeHead(400);
      res.end('Invalid image data');
      return;
    }
    
    const imageType = matches[1];
    const base64Data = matches[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    res.writeHead(200, { 
      'Content-Type': `image/${imageType}`,
      'Cache-Control': 'public, max-age=604800' // 7 days
    });
    res.end(imageBuffer);
  } catch (error) {
    console.error('Image get error:', error);
    res.writeHead(500);
    res.end('Failed to retrieve image');
  }
}

async function handleShareData(req, res, url) {
  const resultId = url.searchParams.get('id');
  
  if (!resultId) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Missing result ID' }));
    return;
  }
  
  try {
    const metadataKey = `speedtest:metadata:${resultId}`;
    const metadata = await redis.get(metadataKey);
    
    if (!metadata) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Result not found or expired' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, metadata: JSON.parse(metadata) }));
  } catch (error) {
    console.error('Share data error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Failed to retrieve share data' }));
  }
}

