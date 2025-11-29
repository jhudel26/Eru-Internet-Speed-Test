module.exports = (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'POST') {
        try {
            // Get the raw body data
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
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
