// API endpoint to forward booking/enquiry to Web3Forms
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const {
    name,
    email,
    course,
    accommodation,
    experience_level,
    message,
    paymentChoice,
    price,
    deposit
  } = req.body || {};

  // Web3Forms API key (set this in your .env file)
  const WEB3FORMS_ACCESS_KEY = process.env.WEB3FORMS_ACCESS_KEY;
  if (!WEB3FORMS_ACCESS_KEY) {
    return res.status(500).json({ error: 'Web3Forms access key not set' });
  }

  // Compose Web3Forms payload
  const payload = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: 'New Booking/Enquiry',
    from_name: name,
    email,
    message: `Course: ${course}\nAccommodation: ${accommodation}\nExperience: ${experience_level}\nPayment: ${paymentChoice}\nPrice: ฿${price}\nDeposit: ฿${deposit}\nMessage: ${message}`,
  };

  try {
    const wfRes = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const wfData = await wfRes.json();
    if (wfData.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: wfData.message || 'Web3Forms error' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send via Web3Forms' });
  }
};
