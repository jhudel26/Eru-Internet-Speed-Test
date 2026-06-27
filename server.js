const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const RESULTS_FILE = './results.json';

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

// Helper function to read results
function readResults() {
  try {
    const data = fs.readFileSync(RESULTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Helper function to write results
function writeResults(results) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

// Helper function to generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // API Routes
  if (url.pathname === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const result = JSON.parse(body);
        const id = generateId();
        const results = readResults();
        results[id] = {
          ...result,
          createdAt: new Date().toISOString()
        };
        writeResults(results);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id, success: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
    return;
  }
  
  if (url.pathname.startsWith('/api/results/') && req.method === 'GET') {
    const id = url.pathname.split('/').pop();
    const results = readResults();
    const result = results[id];
    
    if (result) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Result not found' }));
    }
    return;
  }
  
  if (url.pathname === '/api/og' && req.method === 'GET') {
    const id = url.searchParams.get('result');
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing result parameter');
      return;
    }
    
    const results = readResults();
    const result = results[id];
    
    if (!result) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Result not found');
      return;
    }
    
    try {
      const { downloadSpeed, uploadSpeed, ping, isp, location } = result;
      
      const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1e3a5f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="card-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:0.9" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg-gradient)"/>
  
  <!-- Grid Pattern -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59, 130, 246, 0.1)" stroke-width="1"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#grid)"/>
  
  <!-- Header -->
  <text x="60" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#60a5fa">
    ⚡ ERU SPEED TEST
  </text>
  <text x="60" y="115" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">
    Internet Speed Result
  </text>
  
  <!-- Main Stats Card -->
  <rect x="60" y="150" width="1080" height="400" rx="20" fill="url(#card-gradient)" stroke="rgba(59, 130, 246, 0.3)" stroke-width="2"/>
  
  <!-- Download Speed -->
  <text x="100" y="220" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">DOWNLOAD</text>
  <text x="100" y="300" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#3b82f6" filter="url(#glow)">
    ${downloadSpeed.toFixed(1)}
  </text>
  <text x="300" y="300" font-family="Arial, sans-serif" font-size="32" fill="#60a5fa">Mbps</text>
  <text x="100" y="340" font-family="Arial, sans-serif" font-size="24" fill="#4ade80">↓</text>
  
  <!-- Upload Speed -->
  <text x="450" y="220" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">UPLOAD</text>
  <text x="450" y="300" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#8b5cf6" filter="url(#glow)">
    ${uploadSpeed.toFixed(1)}
  </text>
  <text x="650" y="300" font-family="Arial, sans-serif" font-size="32" fill="#a78bfa">Mbps</text>
  <text x="450" y="340" font-family="Arial, sans-serif" font-size="24" fill="#4ade80">↑</text>
  
  <!-- Ping -->
  <text x="800" y="220" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">PING</text>
  <text x="800" y="300" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#06b6d4" filter="url(#glow)">
    ${ping.toFixed(0)}
  </text>
  <text x="920" y="300" font-family="Arial, sans-serif" font-size="32" fill="#22d3ee">ms</text>
  
  <!-- Additional Info -->
  <text x="100" y="420" font-family="Arial, sans-serif" font-size="16" fill="#64748b">
    ISP: ${isp || 'Unknown'}
  </text>
  <text x="100" y="450" font-family="Arial, sans-serif" font-size="16" fill="#64748b">
    Location: ${location || 'Unknown'}
  </text>
  
  <!-- Timestamp -->
  <text x="1140" y="530" font-family="Arial, sans-serif" font-size="14" fill="#475569" text-anchor="end">
    ${new Date().toLocaleDateString()}
  </text>
  
  <!-- Footer -->
  <rect x="60" y="570" width="1080" height="2" fill="rgba(59, 130, 246, 0.3)"/>
  <text x="60" y="595" font-family="Arial, sans-serif" font-size="14" fill="#64748b">
    Test your internet speed at eruspeedtest.vercel.app
  </text>
</svg>`;

      res.writeHead(200, { 
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      });
      res.end(svg);
    } catch (error) {
      console.error('Error generating OG image:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error generating image');
    }
    return;
  }
  
  // Remove query string and decode URI
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
  
  // Handle share route
  if (filePath.startsWith('./share/')) {
    const id = filePath.replace('./share/', '').replace('.html', '');
    const results = readResults();
    const result = results[id];
    
    if (result) {
      // Read share.html and replace placeholders
      fs.readFile('./share.html', (err, template) => {
        if (err) {
          res.writeHead(404);
          res.end('Share template not found');
          return;
        }
        
        let content = template.toString();
        const baseUrl = `http://${req.headers.host}`;
        
        // Replace placeholders with actual data
        content = content.replace('{{ID}}', id);
        content = content.replace('{{DOWNLOAD_SPEED}}', result.downloadSpeed.toFixed(1));
        content = content.replace('{{UPLOAD_SPEED}}', result.uploadSpeed.toFixed(1));
        content = content.replace('{{PING}}', result.ping.toFixed(0));
        content = content.replace('{{ISP}}', result.isp || 'Unknown');
        content = content.replace('{{LOCATION}}', result.location || 'Unknown');
        content = content.replace('{{BASE_URL}}', baseUrl);
        content = content.replace('{{OG_IMAGE_URL}}', `${baseUrl}/api/og?result=${id}`);
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<html><body><h1>Result not found</h1><p>The speed test result you are looking for does not exist.</p></body></html>');
    }
    return;
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found, try index.html
        if (filePath !== './index.html') {
          fs.readFile('./index.html', (err, content) => {
            if (err) {
              res.writeHead(404);
              res.end('File Not Found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content, 'utf-8');
            }
          });
        } else {
          res.writeHead(404);
          res.end('File Not Found');
        }
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Set security headers
      const headers = {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      };
      
      // Cache headers
      if (ext === '.html') {
        headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
      } else if (ext === '.js' || ext === '.css') {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      } else {
        headers['Cache-Control'] = 'public, max-age=3600';
      }
      
      res.writeHead(200, headers);
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

