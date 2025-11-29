module.exports = (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
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
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
