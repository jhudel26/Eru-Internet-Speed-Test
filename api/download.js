module.exports = (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        // Extract size from URL parameter
        const urlParts = req.url.split('/');
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
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
