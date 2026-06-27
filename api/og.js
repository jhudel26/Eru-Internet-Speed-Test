const { createClient } = require('@vercel/kv');

export default async function handler(req, res) {
  const { result } = req.query;
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!result) {
    res.status(400).send('Missing result parameter');
    return;
  }
  
  try {
    let speedResult;
    
    // Try to get from Vercel KV
    try {
      const kv = createClient({
        url: process.env.KV_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      
      const resultData = await kv.get(`result:${result}`);
      
      if (resultData) {
        speedResult = JSON.parse(resultData);
      }
    } catch (kvError) {
      console.error('KV not available:', kvError.message);
    }
    
    if (!speedResult) {
      res.status(404).send('Result not found');
      return;
    }
    
    const { downloadSpeed, uploadSpeed, ping, isp, location } = speedResult;
    
    const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
  <text x="100" y="220" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">DOWNLOAD</text>
  <text x="100" y="300" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#3b82f6" filter="url(#glow)">
    ${downloadSpeed.toFixed(1)}
  </text>
  <text x="300" y="300" font-family="Arial, sans-serif" font-size="32" fill="#60a5fa">Mbps</text>
  <text x="100" y="340" font-family="Arial, sans-serif" font-size="24" fill="#4ade80">↓</text>
  
  <!-- Upload Speed -->
  <text x="450" y="220" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">UPLOAD</text>
  <text x="450" y="300" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#8b5cf6" filter="url(#glow)">
    ${uploadSpeed.toFixed(1)}
  </text>
  <text x="650" y="300" font-family="Arial, sans-serif" font-size="32" fill="#a78bfa">Mbps</text>
  <text x="450" y="340" font-family="Arial, sans-serif" font-size="24" fill="#4ade80">↑</text>
  
  <!-- Ping -->
  <text x="800" y="220" font-family="Arial, sans-serif" font-size="20" fill="#94a3b8">PING</text>
  <text x="800" y="300" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#06b6d4" filter="url(#glow)">
    ${ping.toFixed(0)}
  </text>
  <text x="920" y="300" font-family="Arial, sans-serif" font-size="32" fill="#22d3ee">ms</text>
  
  <!-- Additional Info -->
  <text x="100" y="420" font-family="Arial, sans-serif" font-size="16" fill="#64748b">
    ISP: ${isp || 'Unknown'}
  </text>
  <text x="100" y="450" font-family="Arial, sans-serif" font-size="16" fill="#64748b">
    Location: ${location || 'Unknown'}
  </text>
  
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

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(svg);
  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).send('Error generating image');
  }
}