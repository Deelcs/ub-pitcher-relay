const express = require('express');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// ←←← YOUR EXACT INFO HERE (use the URL Sportradar gave you for Push Events)
const SPORT_RADAR_PUSH_URL = 'https://api.sportradar.com/mlb/trial/stream/en/events/subscribe';  
// Try changing 'trial' to 'production' if your add-on is production level

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
    // This helps with 302 redirects
    followRedirect: true  
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Connected! Status: ${res.statusCode}`);

    if (res.statusCode === 302 || res.statusCode === 301) {
      console.log('Following redirect to:', res.headers.location);
      // For now, we'll log it — next version can auto-follow better
    }

    res.on('data', (chunk) => {
      try {
        const text = chunk.toString().trim();
        if (text && text.length > 20) {  // Skip small heartbeats
          const data = JSON.parse(text);
          
          // Look for real event data (pitches, game events, etc.)
          if (data && (data.payload || data.event || data.type || data.game)) {
            latestPitchData = data;
            console.log('🎯 REAL PITCH / GAME EVENT SAVED!');
          }
        }
      } catch (e) {
        // Normal with chunked streaming
      }
    });

    res.on('end', () => {
      console.log('Stream ended. Reconnecting in 5 seconds...');
      setTimeout(startPushStream, 5000);
    });
  });

  req.on('error', (err) => {
    console.error('Connection error:', err.message);
    setTimeout(startPushStream, 10000);
  });

  req.end();
}

// Endpoint for your Anything AI app
app.get('/api/latest', (req, res) => {
  res.json(latestPitchData);
});

app.listen(PORT, () => {
  console.log(`🚀 Push relay running on port ${PORT}`);
  startPushStream();
});
