const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

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

module.exports = app;
