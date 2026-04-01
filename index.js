const express = require('express');
const https = require('follow-redirects').https;

const app = express();
const PORT = process.env.PORT || 3000;

// ←←← YOUR INFO (update if needed)
const SPORT_RADAR_PUSH_URL = 'https://api.sportradar.com/mlb/trial/stream/en/events/subscribe';
const API_KEY = 'AsOgWHeCj2tGlzYYeUMF7Nk0ovj6NKlClNXDtdC1';

let latestData = {
  game: {
    home_team: "No game",
    away_team: "No game",
    home_score: 0,
    away_score: 0,
    inning: null,
    inning_half: "",
    status: "no_game"
  },
  current_event: {
    type: "none",
    hitter: "",
    pitcher: "",
    hitter_hand: "",
    pitcher_hand: ""
  },
  last_updated: new Date().toISOString(),
  message: "No live MLB games right now. Waiting for next game..."
};

function startPushStream() {
  console.log('Connecting to Sportradar Push...');

  const url = new URL(SPORT_RADAR_PUSH_URL);

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'GET',
    headers: { 'x-api-key': API_KEY },
    maxRedirects: 5,
    followRedirects: true
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Connected! Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
      try {
        const text = chunk.toString().trim();
        if (text && text.length > 30) {
          const raw = JSON.parse(text);

          if (raw.payload && raw.payload.game) {
            const g = raw.payload.game;
            const e = raw.payload.event || {};

            latestData = {
              game: {
                home_team: g.home?.name || "Unknown",
                away_team: g.away?.name || "Unknown",
                home_score: g.home?.runs || 0,
                away_score: g.away?.runs || 0,
                inning: g.inning || e.inning,
                inning_half: e.inning_half === "T" ? "Top" : (e.inning_half === "B" ? "Bottom" : ""),
                status: g.status || "inprogress"
              },
              current_event: {
                type: e.type || "none",
                hitter: e.hitter?.full_name || "",
                pitcher: e.pitcher?.full_name || "",
                hitter_hand: e.hitter_hand || "",
                pitcher_hand: e.pitcher_hand || ""
              },
              last_updated: new Date().toISOString(),
              message: "Live data updating..."
            };

            console.log('🎯 Simplified pitch/game event saved!');
          }
        }
      } catch (e) {
        // ignore parsing errors on partial chunks
      }
    });

    res.on('end', () => {
      console.log('Stream ended. Reconnecting...');
      setTimeout(startPushStream, 5000);
    });
  });

  req.on('error', (err) => {
    console.error('Connection error:', err.message);
    setTimeout(startPushStream, 10000);
  });

  req.end();
}

app.get('/api/latest', (req, res) => {
  res.json(latestData);
});

app.listen(PORT, () => {
  console.log(`🚀 Simplified Push relay running on port ${PORT}`);
  startPushStream();
});
