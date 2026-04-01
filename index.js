const express = require('express');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// ←←← UPDATE THESE WITH YOUR EXACT INFO
const SPORT_RADAR_PUSH_URL = 'https://api.sportradar.com/mlb/trial/stream/en/events/subscribe';  
// Try 'production' or 'trial' depending on your access level. 
// If you have a specific game filter, add ?match=sd:match:YOUR_GAME_ID at the end.

const API_KEY = 'AsOgWHeCj2tGlzYYeUMF7Nk0ovj6NKlClNXDtdC1';

let latestPitchData = { 
  message: "Connected to Sportradar Push. Waiting for real pitch/game events..." 
};

function startPushStream() {
  console.log('Connecting to Sportradar Push API...');

  const url = new URL(SPORT_RADAR_PUSH_URL);

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'x-api-key': API_KEY
    }
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Connected! Status: ${res.statusCode} - Receiving live data...`);

    res.on('data', (chunk) => {
      try {
        const text = chunk.toString().trim();
        if (text && text.length > 10) {   // Skip tiny heartbeats
          const data = JSON.parse(text);
          
          // Save meaningful payloads (game events, pitches, etc.)
          if (data && (data.payload || data.event || data.game)) {
            latestPitchData = data;
            console.log('🎯 Real pitch/game event received and saved!');
          } 
          // Heartbeat - just keep alive silently
          else if (data.heartbeat) {
            // console.log('❤️ Heartbeat received');
          }
        }
      } catch (e) {
        // Normal for streaming — ignore partial chunks
      }
    });

    res.on('end', () => {
      console.log('Stream ended. Reconnecting in 3 seconds...');
      setTimeout(startPushStream, 3000);
    });
  });

  req.on('error', (err) => {
    console.error('❌ Connection error:', err.message);
    setTimeout(startPushStream, 10000);
  });

  req.end();
}

app.get('/api/latest', (req, res) => {
  res.json(latestPitchData);
});

app.listen(PORT, () => {
  console.log(`🚀 Push relay running on port ${PORT}`);
  startPushStream();
});
