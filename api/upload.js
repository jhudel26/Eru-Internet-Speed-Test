const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

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

module.exports = app;
