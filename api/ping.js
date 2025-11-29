const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

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
