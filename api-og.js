const { createCanvas } = require('canvas');

// Generate OG image using Canvas
function generateOGImage(result) {
    const { downloadSpeed, uploadSpeed, ping, isp, location } = result;
    
    // Create canvas with OG dimensions
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#1e3a5f');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);
    
    // Grid pattern
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 1200; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 630);
        ctx.stroke();
    }
    for (let i = 0; i < 630; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1200, i);
        ctx.stroke();
    }
    
    // Header
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('⚡ ERU SPEED TEST', 60, 80);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px Arial';
    ctx.fillText('Internet Speed Result', 60, 115);
    
    // Main card background
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    if (ctx.roundRect) {
        ctx.roundRect(60, 150, 1080, 400, 20);
    } else {
        ctx.fillRect(60, 150, 1080, 400);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Download Speed
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px Arial';
    ctx.fillText('DOWNLOAD', 100, 220);
    
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 72px Arial';
    ctx.fillText(downloadSpeed.toFixed(1), 100, 300);
    
    ctx.fillStyle = '#60a5fa';
    ctx.font = '32px Arial';
    ctx.fillText('Mbps', 300, 300);
    
    ctx.fillStyle = '#4ade80';
    ctx.font = '16px Arial';
    ctx.fillText('↓', 100, 340);
    
    // Upload Speed
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px Arial';
    ctx.fillText('UPLOAD', 450, 220);
    
    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 72px Arial';
    ctx.fillText(uploadSpeed.toFixed(1), 450, 300);
    
    ctx.fillStyle = '#a78bfa';
    ctx.font = '32px Arial';
    ctx.fillText('Mbps', 650, 300);
    
    ctx.fillStyle = '#4ade80';
    ctx.font = '16px Arial';
    ctx.fillText('↑', 450, 340);
    
    // Ping
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px Arial';
    ctx.fillText('PING', 800, 220);
    
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 72px Arial';
    ctx.fillText(ping.toFixed(0), 800, 300);
    
    ctx.fillStyle = '#22d3ee';
    ctx.font = '32px Arial';
    ctx.fillText('ms', 920, 300);
    
    // Additional Info
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Arial';
    ctx.fillText(`ISP: ${isp || 'Unknown'}`, 100, 420);
    ctx.fillText(`Location: ${location || 'Unknown'}`, 100, 450);
    
    // Timestamp
    ctx.fillStyle = '#475569';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleDateString(), 1140, 530);
    ctx.textAlign = 'left';
    
    // Footer line
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 570);
    ctx.lineTo(1140, 570);
    ctx.stroke();
    
    // Footer text
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Arial';
    ctx.fillText('Test your internet speed at eruspeedtest.vercel.app', 60, 595);
    
    return canvas.toBuffer('image/png');
}

module.exports = { generateOGImage };