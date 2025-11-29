const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
    server,
    perMessageDeflate: false
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "wss:", "ws:", "https://api.ipify.org"],
            imgSrc: ["'self'", "data:"]
        }
    }
}));

// Rate limiting for API endpoints
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});

app.use(limiter);
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || ['http://localhost:3000'],
    credentials: true
}));
app.use(compression({
    threshold: 1024,
    level: 6
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend'), {
    maxAge: '1d',
    etag: true
}));

// Cache middleware for static files
const staticCache = (req, res, next) => {
    if (req.url.includes('.')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    next();
};

app.get('/', staticCache, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Optimized download endpoint with streaming
app.get('/download/:size', (req, res) => {
    const size = parseFloat(req.params.size) * 1024 * 1024;
    
    if (size <= 0 || size > 100 * 1024 * 1024) {
        return res.status(400).json({ error: 'Invalid file size' });
    }
    
    // Stream data instead of creating large buffer
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    
    const chunkSize = 64 * 1024; // 64KB chunks
    let remaining = size;
    
    const sendChunk = () => {
        if (remaining <= 0) {
            res.end();
            return;
        }
        
        const currentChunkSize = Math.min(chunkSize, remaining);
        const chunk = Buffer.alloc(currentChunkSize);
        
        // Fill with random data more efficiently
        for (let i = 0; i < currentChunkSize; i++) {
            chunk[i] = Math.floor(Math.random() * 256);
        }
        
        res.write(chunk);
        remaining -= currentChunkSize;
        
        // Use setImmediate for non-blocking
        setImmediate(sendChunk);
    };
    
    sendChunk();
});

// Optimized upload endpoint with better error handling
app.post('/upload', express.raw({ type: 'application/octet-stream', limit: '100mb' }), (req, res) => {
    try {
        const receivedBytes = req.body ? req.body.length : 0;
        res.json({ 
            receivedBytes,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload processing failed' });
    }
});

// WebSocket connection management with heartbeat
const clients = new Set();

wss.on('connection', (ws, req) => {
    const clientId = req.headers['sec-websocket-key'];
    clients.add(ws);
    console.log(`WebSocket client connected: ${clientId}`);
    
    // Send welcome message
    ws.send(JSON.stringify({ 
        type: 'connected', 
        message: 'Connected to speed test server',
        timestamp: Date.now()
    }));
    
    // Setup heartbeat
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'ping') {
                const startTime = Date.now();
                ws.send(JSON.stringify({ 
                    type: 'pong', 
                    timestamp: startTime,
                    serverTime: Date.now()
                }));
            } else if (data.type === 'status') {
                ws.send(JSON.stringify({
                    type: 'status',
                    connectedClients: clients.size,
                    serverUptime: process.uptime()
                }));
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
            ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Invalid message format' 
            }));
        }
    });
    
    ws.on('close', () => {
        clients.delete(ws);
        console.log(`WebSocket client disconnected: ${clientId}`);
    });
    
    ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
        clients.delete(ws);
    });
});

// WebSocket heartbeat interval
const heartbeatInterval = setInterval(() => {
    clients.forEach(ws => {
        if (!ws.isAlive) {
            ws.terminate();
            clients.delete(ws);
            return;
        }
        
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    clearInterval(heartbeatInterval);
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    clearInterval(heartbeatInterval);
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Speed test server running on port ${PORT}`);
    console.log(`📊 Open http://localhost:${PORT} to start testing`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
