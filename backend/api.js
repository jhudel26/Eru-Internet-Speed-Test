const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://api.ipify.org"],
            imgSrc: ["'self'", "data:"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});

app.use(limiter);
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Optimized download endpoint with realistic throttling
app.get('/api/download/:size', (req, res) => {
    const size = parseFloat(req.params.size) * 1024 * 1024;
    
    if (size <= 0 || size > 100 * 1024 * 1024) {
        return res.status(400).json({ error: 'Invalid file size' });
    }
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', size);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Simulate realistic network speeds (throttle to ~100 Mbps max)
    const maxSpeedBytesPerSecond = 12.5 * 1024 * 1024; // 100 Mbps
    const chunkSize = 64 * 1024; // 64KB chunks
    let remaining = size;
    
    const sendChunk = () => {
        if (remaining <= 0) {
            res.end();
            return;
        }
        
        const currentChunkSize = Math.min(chunkSize, remaining);
        const chunk = Buffer.alloc(currentChunkSize);
        
        // Fill with random data
        for (let i = 0; i < currentChunkSize; i++) {
            chunk[i] = Math.floor(Math.random() * 256);
        }
        
        res.write(chunk);
        remaining -= currentChunkSize;
        
        // Throttle to realistic speed
        const delay = (currentChunkSize / maxSpeedBytesPerSecond) * 1000;
        setTimeout(sendChunk, delay);
    };
    
    sendChunk();
});

// Optimized upload endpoint
app.post('/api/upload', express.raw({ type: 'application/octet-stream', limit: '100mb' }), (req, res) => {
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

// Status endpoint with realistic server info
app.get('/api/status', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        version: '2.0.0',
        server: {
            location: 'Vercel Edge Network',
            provider: 'Vercel',
            region: 'Global CDN'
        },
        limits: {
            maxDownloadSpeed: '100 Mbps',
            maxUploadSpeed: '50 Mbps',
            testDuration: '2 seconds per test'
        }
    });
});

// Enhanced ping endpoint with network simulation
app.get('/api/ping', (req, res) => {
    // Simulate realistic ping times (10-50ms for edge networks)
    const simulatedPing = Math.floor(Math.random() * 40) + 10;
    setTimeout(() => {
        res.json({ 
            timestamp: Date.now(),
            serverTime: Date.now(),
            simulatedPing: simulatedPing
        });
    }, simulatedPing);
});

module.exports = app;
