// Minimal Express server for /api/bookings (SQLite only, no Supabase/Stripe)
const express = require('express');
const bodyParser = require('body-parser');
const bookingsApi = require('./api/bookings.cjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve /api/bookings
app.all('/api/bookings', (req, res) => {
  if (req.method === 'POST' && !req.body) {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { req.body = JSON.parse(data); } catch {}
      bookingsApi(req, res);
    });
  } else {
    bookingsApi(req, res);
  }
});

app.listen(PORT, () => {
  console.log(`Minimal bookings API running at http://localhost:${PORT}`);
});
