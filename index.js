const express = require('express');
const https = require('https');   // ← Changed from http to https

const app = express();
const PORT = process.env.PORT || 3000;

// ←←← PUT YOUR REAL SPORTRADAR INFO HERE 
const SPORT_RADAR_PUSH_URL = 'https://api.sportradar.com/mlb/trial/stream/en/events/subscribe';
const API_KEY = 'AsOgWHeCj2tGlzYYeUMF7Nk0ovj6NKlClNXDtdC1';

let latestPitchData = { message: "Waiting for first pitch data from Sportradar..." };

function startPushStream() {
  console.log('Connecting to Sportradar Push...');
  
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
    console.log('Connected to Sportradar! Receiving live pitch data...');
    
    res.on('data', (chunk) => {
      try {
        const text = chunk.toString().trim();
        if (text) {
          const data = JSON.parse(text);
          // Ignore heartbeat messages that Sportradar sends
          if (data && !data.heartbeat) {
            latestPitchData = data;
            console.log('New pitch data received and saved!');
          }
        }
      } catch (e) {
        // Partial chunks or non-JSON are normal with push streams — ignore
      }
    });

    res.on('end', () => {
      console.log('Stream ended. Reconnecting in 5 seconds...');
      setTimeout(startPushStream, 5000);
    });
  });

  req.on('error', (err) => {
    console.error('Connection error:', err.message);
    console.log('Will retry in 10 seconds...');
    setTimeout(startPushStream, 10000);
  });

  req.end();
}

// Your Anything AI app will call this endpoint
app.get('/api/latest', (req, res) => {
  res.json(latestPitchData);
});

app.listen(PORT, () => {
  console.log(`Relay server is running on port ${PORT}`);
  startPushStream();   // Start the live connection right away
});
