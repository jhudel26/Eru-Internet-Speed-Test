const fs = require('fs');
const path = require('path');

// Generate OG image using SVG
function generateOGImage(result) {
    const { downloadSpeed, uploadSpeed, ping, isp, location } = result;
    
    const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1e3a5f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="card-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:0.9" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg-gradient)"/>
  
  <!-- Grid Pattern -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59, 130, 246, 0.1)" stroke-width="1"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#grid)"/>
  
  <!-- Header -->
  <text x="60" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#60a5fa">
    ⚡ ERU SPEED TEST
  </text>
  <text x="60" y="115" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">
    Internet Speed Result
  </text>
  
  <!-- Main Stats Card -->
  <rect x="60" y="150" width="1080" height="400" rx="20" fill="url(#card-gradient)" stroke="rgba(59, 130, 246, 0.3)" stroke-width="2"/>
  
  <!-- Download Speed -->
  <g transform="translate(100, 220)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">DOWNLOAD</text>
    <text x="0" y="80" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#3b82f6" filter="url(#glow)">
      ${downloadSpeed.toFixed(1)}
    </text>
    <text x="200" y="80" font-family="Arial, sans-serif" font-size="32" fill="#60a5fa">Mbps</text>
    <text x="0" y="120" font-family="Arial, sans-serif" font-size="16" fill="#4ade80">↓</text>
  </g>
  
  <!-- Upload Speed -->
  <g transform="translate(450, 220)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">UPLOAD</text>
    <text x="0" y="80" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#8b5cf6" filter="url(#glow)">
      ${uploadSpeed.toFixed(1)}
    </text>
    <text x="200" y="80" font-family="Arial, sans-serif" font-size="32" fill="#a78bfa">Mbps</text>
    <text x="0" y="120" font-family="Arial, sans-serif" font-size="16" fill="#4ade80">↑</text>
  </g>
  
  <!-- Ping -->
  <g transform="translate(800, 220)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">PING</text>
    <text x="0" y="80" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#06b6d4" filter="url(#glow)">
      ${ping.toFixed(0)}
    </text>
    <text x="120" y="80" font-family="Arial, sans-serif" font-size="32" fill="#22d3ee">ms</text>
  </g>
  
  <!-- Additional Info -->
  <g transform="translate(100, 420)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="16" fill="#64748b">
      ISP: ${isp || 'Unknown'}
    </text>
    <text x="0" y="30" font-family="Arial, sans-serif" font-size="16" fill="#64748b">
      Location: ${location || 'Unknown'}
    </text>
  </g>
  
  <!-- Timestamp -->
  <text x="1140" y="530" font-family="Arial, sans-serif" font-size="14" fill="#475569" text-anchor="end">
    ${new Date().toLocaleDateString()}
  </text>
  
  <!-- Footer -->
  <rect x="60" y="570" width="1080" height="2" fill="rgba(59, 130, 246, 0.3)"/>
  <text x="60" y="595" font-family="Arial, sans-serif" font-size="14" fill="#64748b">
    Test your internet speed at eruspeedtest.vercel.app
  </text>
</svg>`;

    return svg;
}

module.exports = { generateOGImage };