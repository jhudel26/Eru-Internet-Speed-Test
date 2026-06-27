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

// Helper function to write results
function writeResults(results) {
  fs.writeFileSync(path.join(__dirname, '../results.json'), JSON.stringify(results, null, 2));
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
    console.log('Request method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);
    
    // Get body from Vercel's parsed body or raw body
    let body = req.body;
    
    // Vercel might provide body as a string that needs parsing
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Failed to parse body string:', e);
        res.status(400).json({ error: 'Invalid JSON in request body' });
        return;
      }
    }
    
    // If still no body, this might be a different Vercel format
    if (!body) {
      console.error('No body found in request');
      res.status(400).json({ error: 'Request body is missing or invalid' });
      return;
    }
    
    console.log('Result data:', body);
    
    const id = generateId();
    const results = readResults();
    results[id] = {
      ...body,
      createdAt: new Date().toISOString()
    };
    writeResults(results);
    
    console.log('Successfully saved result with ID:', id);
    
    res.status(200).json({ id, success: true });
  } catch (error) {
    console.error('Error in save handler:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}