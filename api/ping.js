module.exports = (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        // Simulate realistic ping times (10-50ms for edge networks)
        const simulatedPing = Math.floor(Math.random() * 40) + 10;
        setTimeout(() => {
            res.json({ 
                timestamp: Date.now(),
                serverTime: Date.now(),
                simulatedPing: simulatedPing
            });
        }, simulatedPing);
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
