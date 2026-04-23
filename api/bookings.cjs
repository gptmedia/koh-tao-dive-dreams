const dbPath = process.env.SQLITE_PATH || './bookings.db';
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath);

module.exports = (req, res) => {
  if (req.method === 'GET') {
    db.all('SELECT * FROM bookings', [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ bookings: rows });
    });
  } else if (req.method === 'POST') {
    const { id, status, comments, ...rest } = req.body || {};
    if (!id) {
      // Map incoming fields from admin panel to DB columns
      const booking = {
        name: rest.name,
        email: rest.email,
        phone: rest.phone,
        course: rest.course,
        date: rest.date,
        level: rest.level,
        experience: rest.experience,
        comments: rest.comments !== undefined ? rest.comments : (comments !== undefined ? comments : ''),
          if (!id) {
            // CREATE new booking
            const { data, error } = await supabase
              .from('bookings')
              .insert([rest])
              .select();
            if (error) return res.status(500).json({ error: error.message });
            res.status(201).json(data[0]);
            return;
          }
          // UPDATE booking by id
          const { data, error } = await supabase
            .from('bookings')
            .update(rest)
            .eq('id', id)
            .select();
          if (error) return res.status(500).json({ error: error.message });
          res.status(200).json(data[0]);
      });
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
