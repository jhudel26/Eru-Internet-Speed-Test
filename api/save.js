const { createClient } = require('@vercel/kv');

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
    const resultData = {
      downloadSpeed: Number(body.downloadSpeed) || 0,
      uploadSpeed: Number(body.uploadSpeed) || 0,
      ping: Number(body.ping) || 0,
      jitter: Number(body.jitter) || 0,
      isp: body.isp || 'Unknown',
      location: body.location || 'Unknown',
      ipAddress: body.ipAddress || '--',
      createdAt: new Date().toISOString()
    };
    
    // Try to use Vercel KV if available
    try {
      const kv = createClient({
        url: process.env.KV_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      
      // Store the result in KV
      await kv.set(`result:${id}`, JSON.stringify(resultData));
      console.log('Successfully saved result to KV with ID:', id);
      
      return res.status(200).json({ id, success: true });
    } catch (kvError) {
      console.error('KV not available, using fallback:', kvError.message);
      
      // Fallback: Return a temporary ID that encodes the data
      // This allows sharing to work without persistent storage
      const encodedData = btoa(JSON.stringify(resultData)).substring(0, 8);
      const fallbackId = `${id}${encodedData}`;
      
      console.log('Using fallback ID:', fallbackId);
      return res.status(200).json({ id: fallbackId, success: true, fallback: true });
    }
  } catch (error) {
    console.error('Error in save handler:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}