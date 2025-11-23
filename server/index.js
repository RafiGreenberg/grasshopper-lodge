const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function validateBooking(body){
  const errors = [];
  if(!body.name) errors.push('Name is required');
  if(!body.email) errors.push('Email is required');
  if(!body.checkin) errors.push('Check-in date is required');
  if(!body.checkout) errors.push('Check-out date is required');
  if(!body.guests) errors.push('Number of guests is required');
  return errors;
}

app.post('/api/booking', async (req, res) => {
  try{
    const body = req.body || {};
    const errors = validateBooking(body);
    if(errors.length) return res.status(400).json({ error: errors.join('; ') });

    // Persist booking to data/bookings.json (append)
    const dataDir = path.join(__dirname, '..', 'data');
    if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const file = path.join(dataDir, 'bookings.json');
    const entry = Object.assign({ receivedAt: new Date().toISOString() }, body);
    let current = [];
    if(fs.existsSync(file)){
      try{ current = JSON.parse(fs.readFileSync(file)); }catch(e){ current = []; }
    }
    current.push(entry);
    fs.writeFileSync(file, JSON.stringify(current, null, 2));

    // Send email notification if SMTP configured
    const smtpHost = process.env.SMTP_HOST;
    if(smtpHost){
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
      });

      const to = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;
      const subject = process.env.EMAIL_SUBJECT || 'New booking request — Grasshopper Lodge';
      const textLines = [];
      for(const k of Object.keys(entry)) textLines.push(`${k}: ${entry[k]}`);
      const mailOpts = { from: process.env.FROM_EMAIL || 'no-reply@grasshopperlodge.com', to, subject, text: textLines.join('\n') };
      try{
        await transporter.sendMail(mailOpts);
      }catch(err){
        console.error('Email send failed', err);
      }
    }

    return res.json({ ok: true, message: 'Booking request received.' });
  }catch(err){
    console.error('Booking handler error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Simple healthcheck
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, ()=> console.log(`Booking API listening on port ${PORT}`));
