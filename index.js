const express = require('express');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// ←←← PUT YOUR SPORTradar INFO HERE ↓↓↓
const SPORT_RADAR_PUSH_URL = 'https://api.sportradar.com/YOUR-FULL-PUSH-URL-HERE';  // ← replace this whole line
const API_KEY = 'YOUR-SPORTRADAR-API-KEY-HERE';  // ← replace this

let latestPitchData = { message: "Waiting for first pitch data..." };  // will hold the newest data

// Start the connection to Sportradar’s firehose
function startPushStream() {
  console.log('Connecting to Sportradar Push...');
  
  const options = {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY
    }
  };

  const req = http.request(SPORT_RADAR_PUSH_URL, options, (res) => {
    console.log('Connected! Receiving live pitch data...');
    
    res.on('data', (chunk) => {
      try {
        const data = JSON.parse(chunk.toString().trim());
        if (data && !data.heartbeat) {  // ignore heartbeats
          latestPitchData = data;
          console.log('New pitch data received!');
        }
      } catch (e) {
        // sometimes chunks are partial — ignore for now
      }
    });
  });

  req.on('error', (err) => {
    console.error('Connection error, retrying in 10s...', err.message);
    setTimeout(startPushStream, 10000);
  });

  req.end();
}

// API endpoint your Anything AI app will call
app.get('/api/latest', (req, res) => {
  res.json(latestPitchData);
});

app.listen(PORT, () => {
  console.log(`Relay server running on port ${PORT}`);
  startPushStream();  // start the firehose immediately
});
