const { createClient } = require('@vercel/kv');

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Try to get from Vercel KV
    try {
      const kv = createClient({
        url: process.env.KV_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      
      const result = await kv.get(`result:${id}`);
      
      if (result) {
        return res.status(200).json(JSON.parse(result));
      }
    } catch (kvError) {
      console.error('KV not available:', kvError.message);
    }
    
    // Fallback: If KV is not available, return an error
    // In production, you should set up Vercel KV
    return res.status(404).json({ 
      error: 'Result not found',
      message: 'Vercel KV storage is not configured. Please add Vercel KV to your project.'
    });
  } catch (error) {
    console.error('Error in results handler:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}