const fs = require('fs');
const path = require('path');

// Helper function to read results
function readResults() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../results.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

export default function handler(req, res) {
  // Extract ID from URL path
  const urlPath = req.url;
  const idMatch = urlPath.match(/\/share\/([a-zA-Z0-9]+)/);
  const id = idMatch ? idMatch[1] : req.query.id;
  
  if (!id) {
    res.status(400).send('Missing result ID');
    return;
  }

  const results = readResults();
  const result = results[id];
  
  if (!result) {
    res.status(404).send('<html><body><h1>Result not found</h1><p>The speed test result you are looking for does not exist.</p></body></html>');
    return;
  }
  
  // Read share.html and replace placeholders
  const templatePath = path.join(__dirname, '../share.html');
  const template = fs.readFileSync(templatePath, 'utf8');
  
  let content = template;
  const baseUrl = `https://${req.headers.host}`;
  
  // Replace placeholders with actual data
  content = content.replace(/\{\{ID\}\}/g, id);
  content = content.replace(/\{\{DOWNLOAD_SPEED\}\}/g, result.downloadSpeed.toFixed(1));
  content = content.replace(/\{\{UPLOAD_SPEED\}\}/g, result.uploadSpeed.toFixed(1));
  content = content.replace(/\{\{PING\}\}/g, result.ping.toFixed(0));
  content = content.replace(/\{\{ISP\}\}/g, result.isp || 'Unknown');
  content = content.replace(/\{\{LOCATION\}\}/g, result.location || 'Unknown');
  content = content.replace(/\{\{BASE_URL\}\}/g, baseUrl);
  content = content.replace(/\{\{OG_IMAGE_URL\}\}/g, `${baseUrl}/api/og?result=${id}`);
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(content);
}