const http = require('http');
const fs = require('fs');
const path = require('path');
const { generateOGImage } = require('./api-og');

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
      const svg = generateOGImage(result);
      res.writeHead(200, { 
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      });
      res.end(svg);
    } catch (error) {
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

