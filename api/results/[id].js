const fs = require('fs');
const path = require('path');

// Helper function to read results
function readResults() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../../results.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

export default function handler(req, res) {
  const { id } = req.query;
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const results = readResults();
  const result = results[id];
  
  if (result) {
    res.status(200).json(result);
  } else {
    res.status(404).json({ error: 'Result not found' });
  }
}