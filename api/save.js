const fs = require('fs');
const path = require('path');

// Helper function to read results
function readResults() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../results.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty object if file doesn't exist
    console.log('Results file not found, creating new');
    return {};
  }
}

// Helper function to write results
function writeResults(results) {
  try {
    const filePath = path.join(__dirname, '../results.json');
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    console.log('Successfully wrote results to file');
  } catch (error) {
    console.error('Error writing results:', error);
    throw new Error('Failed to save results: ' + error.message);
  }
}

// Helper function to generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('=== SAVE API DEBUG ===');
    console.log('Request method:', req.method);
    console.log('Content-Type header:', req.headers['content-type']);
    console.log('Body type:', typeof req.body);
    console.log('Body value:', req.body);
    
    // Vercel serverless functions automatically parse JSON
    let body = req.body;
    
    // Handle different body formats
    if (!body) {
      console.error('No body in request');
      return res.status(400).json({ error: 'Request body is required' });
    }
    
    // If body is a string, try to parse it
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
        console.log('Parsed string body:', body);
      } catch (e) {
        console.error('Failed to parse body string:', e);
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }
    
    // Validate body structure
    if (!body || typeof body !== 'object') {
      console.error('Invalid body structure:', typeof body);
      return res.status(400).json({ error: 'Invalid request body format' });
    }
    
    // Ensure required fields exist
    if (body.downloadSpeed === undefined || body.uploadSpeed === undefined || body.ping === undefined) {
      console.error('Missing required fields:', body);
      return res.status(400).json({ error: 'Missing required fields: downloadSpeed, uploadSpeed, ping' });
    }
    
    console.log('Valid result data:', body);
    
    const id = generateId();
    const results = readResults();
    results[id] = {
      downloadSpeed: Number(body.downloadSpeed) || 0,
      uploadSpeed: Number(body.uploadSpeed) || 0,
      ping: Number(body.ping) || 0,
      jitter: Number(body.jitter) || 0,
      isp: body.isp || 'Unknown',
      location: body.location || 'Unknown',
      ipAddress: body.ipAddress || '--',
      createdAt: new Date().toISOString()
    };
    
    writeResults(results);
    console.log('Successfully saved result with ID:', id);
    
    return res.status(200).json({ id, success: true });
  } catch (error) {
    console.error('Error in save handler:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}