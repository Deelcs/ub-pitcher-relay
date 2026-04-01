const express = require('express');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// ←←← YOUR INFO (use the original URL Sportradar gave you)
const SPORT_RADAR_PUSH_URL = 'https://api.sportradar.com/mlb/trial/stream/en/events/subscribe';  
// Change to 'production' if your add-on is production level

const API_KEY = 'AsOgWHeCj2tGlzYYeUMF7Nk0ovj6NKlClNXDtdC1';

let latestPitchData = { 
  message: "Connected to Sportradar Push. Waiting for real pitch events..." 
};

function startPushStream() {
  console.log('Connecting to Sportradar Push...');

  const url = new URL(SPORT_RADAR_PUSH_URL);

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'x-api-key': API_KEY
    },
    // Important: Follow redirects automatically
    maxRedirects: 5
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Connected! Final Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
      try {
        const text = chunk.toString().trim();
        if (text && text.length > 30) {  // Skip small heartbeats
          const data = JSON.parse(text);
          
          // Save real events (pitches, at-bats, game updates, etc.)
          if (data && (data.payload || data.event || data.type === 'pitch' || data.game)) {
            latestPitchData = data;
            console.log('🎯 REAL PITCH / GAME EVENT RECEIVED AND SAVED!');
          }
        }
      } catch (e) {
        // Normal for streaming data chunks
      }
    });

    res.on('end', () => {
      console.log('Stream ended. Reconnecting in 5 seconds...');
      setTimeout(startPushStream, 5000);
    });
  });

  req.on('error', (err) => {
    console.error('❌ Connection error:', err.message);
    setTimeout(startPushStream, 10000);
  });

  req.end();
}

// This is what Anything AI will call
app.get('/api/latest', (req, res) => {
  res.json(latestPitchData);
});

app.listen(PORT, () => {
  console.log(`🚀 Push relay running on port ${PORT}`);
  startPushStream();
});
