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

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const result = req.body;
    const id = generateId();
    const results = readResults();
    results[id] = {
      ...result,
      createdAt: new Date().toISOString()
    };
    writeResults(results);
    
    res.status(200).json({ id, success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request body' });
  }
}