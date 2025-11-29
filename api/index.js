module.exports = (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Route based on URL
    const url = req.url;
    
    // Status endpoint
    if (url === '/api/status' && req.method === 'GET') {
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
        return;
    }
    
    // Ping endpoint
    if (url === '/api/ping' && req.method === 'GET') {
        const simulatedPing = Math.floor(Math.random() * 40) + 10;
        setTimeout(() => {
            res.json({ 
                timestamp: Date.now(),
                serverTime: Date.now(),
                simulatedPing: simulatedPing
            });
        }, simulatedPing);
        return;
    }
    
    // Upload endpoint
    if (url === '/api/upload' && req.method === 'POST') {
        try {
            const chunks = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', () => {
                const receivedBytes = Buffer.concat(chunks).length;
                res.json({ 
                    receivedBytes,
                    timestamp: Date.now()
                });
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Upload processing failed' });
        }
        return;
    }
    
    // Download endpoint
    if (url.startsWith('/api/download/') && req.method === 'GET') {
        const urlParts = url.split('/');
        const sizeParam = urlParts[urlParts.length - 1];
        const size = parseFloat(sizeParam) * 1024 * 1024;
        
        if (size <= 0 || size > 100 * 1024 * 1024) {
            return res.status(400).json({ error: 'Invalid file size' });
        }
        
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', size);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        const maxSpeedBytesPerSecond = 12.5 * 1024 * 1024; // 100 Mbps
        const chunkSize = 64 * 1024;
        let remaining = size;
        
        const sendChunk = () => {
            if (remaining <= 0) {
                res.end();
                return;
            }
            
            const currentChunkSize = Math.min(chunkSize, remaining);
            const chunk = Buffer.alloc(currentChunkSize);
            
            for (let i = 0; i < currentChunkSize; i++) {
                chunk[i] = Math.floor(Math.random() * 256);
            }
            
            res.write(chunk);
            remaining -= currentChunkSize;
            
            const delay = (currentChunkSize / maxSpeedBytesPerSecond) * 1000;
            setTimeout(sendChunk, delay);
        };
        
        sendChunk();
        return;
    }
    
    // 404 for unknown routes
    res.status(404).json({ error: 'API endpoint not found' });
};
