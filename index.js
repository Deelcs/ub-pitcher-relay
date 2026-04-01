const express = require('express');
const https = require('follow-redirects').https;  // This handles 302 redirects properly

const app = express();
const PORT = process.env.PORT || 3000;

// ←←← YOUR INFO HERE
const SPORT_RADAR_PUSH_URL = 'https://api.sportradar.com/mlb/trial/stream/en/events/subscribe';
// Change 'trial' to 'production' if your add-on key is for production

const API_KEY = 'AsOgWHeCj2tGlzYYeUMF7Nk0ovj6NKlClNXDtdC1';

let latestPitchData = { 
  message: "Connected to Sportradar Push. Waiting for real pitch events..." 
};

function startPushStream() {
  console.log('Connecting to Sportradar Push (following redirect)...');

  const url = new URL(SPORT_RADAR_PUSH_URL);

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'x-api-key': API_KEY
    },
    maxRedirects: 5,           // Follow up to 5 redirects
    followRedirects: true      // Important for the 302
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Connected to final streaming endpoint! Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
      try {
        const text = chunk.toString().trim();
        if (text && text.length > 30) {   // Filter out tiny heartbeats
          const data = JSON.parse(text);
          
          // Save real events (look for payload, event, pitch, etc.)
          if (data && (data.payload || data.event || data.type || data.game)) {
            latestPitchData = data;
            console.log('🎯 REAL PITCH / GAME EVENT RECEIVED AND SAVED!');
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
