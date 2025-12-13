const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust the first proxy (Cloud Run / load balancer) so req.ip reflects the real client IP
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet());

// CORS: restrict to allowed origins. Set `ALLOWED_ORIGINS` as comma-separated env var.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://demo.grasshopperlodge.com').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function(origin, callback){
    // allow non-browser requests (e.g. curl/postman) that have no origin
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS policy: origin not allowed'));
  }
}));

// Limit request body size
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.use(express.json({ limit: '16kb' }));

// Generic rate limiter for all requests (lightweight)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
}));

function sanitizeString(s){
  if(typeof s !== 'string') return '';
  return s.replace(/\u0000/g, '').trim();
}

function validateBooking(body){
  const errors = [];
  const name = sanitizeString(body.name);
  const email = sanitizeString(body.email);
  const checkin = sanitizeString(body.checkin);
  const checkout = sanitizeString(body.checkout);
  const guests = typeof body.guests === 'number' ? body.guests : parseInt(body.guests, 10);

  if(!name) errors.push('Name is required');
  if(!email) errors.push('Email is required');
  else if(!/^\S+@\S+\.\S+$/.test(email)) errors.push('Email appears invalid');
  if(!checkin) errors.push('Check-in date is required');
  if(!checkout) errors.push('Check-out date is required');
  if(checkin && checkout){
    const ci = Date.parse(checkin);
    const co = Date.parse(checkout);
    if(Number.isNaN(ci) || Number.isNaN(co)) errors.push('Dates must be valid ISO dates');
    else if(ci >= co) errors.push('Check-out must be after check-in');
  }
  if(!guests || Number.isNaN(guests) || guests <= 0) errors.push('Number of guests must be a positive integer');
  if(guests > 20) errors.push('Number of guests too large');

  return { errors, cleaned: { name, email, checkin, checkout, guests, notes: sanitizeString(body.notes || '') } };
}

// tighter rate limiting for booking endpoint to limit abuse
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // max 20 bookings per IP per hour
  message: { error: 'Too many booking attempts from this IP, please try later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/booking', bookingLimiter, async (req, res) => {
  try{
    const body = req.body || {};
    // If reCAPTCHA is configured, require and verify token before processing
    const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
    if(RECAPTCHA_SECRET){
      const token = (body['g-recaptcha-response'] || body['g-recaptcha'] || req.headers['x-recaptcha-response'] || req.headers['x-g-recaptcha-response'] || '').toString();
      if(!token){
        return res.status(403).json({ error: 'reCAPTCHA token missing' });
      }
      try{
        const params = new URLSearchParams();
        params.append('secret', RECAPTCHA_SECRET);
        params.append('response', token);
        params.append('remoteip', req.ip);
        const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: params });
        const j = await resp.json();
        const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.45');
        if(!j.success){
          console.error('reCAPTCHA verify failed', j);
          return res.status(403).json({ error: 'reCAPTCHA verification failed' });
        }
        // If score is present (v3) enforce threshold
        if(typeof j.score === 'number' && j.score < minScore){
          console.error('reCAPTCHA low score', j.score, 'threshold', minScore);
          return res.status(403).json({ error: 'reCAPTCHA verification failed (low score)' });
        }
      }catch(verErr){
        console.error('reCAPTCHA verification error', verErr);
        return res.status(500).json({ error: 'reCAPTCHA verification error' });
      }
    }
    const { errors, cleaned } = validateBooking(body);
    if(errors.length) return res.status(400).json({ error: errors.join('; ') });

    // Persist booking to data/bookings.json (async)
    const dataDir = path.join(process.cwd(), 'data');
    await fsp.mkdir(dataDir, { recursive: true });
    const file = path.join(dataDir, 'bookings.json');
    const entry = Object.assign({ receivedAt: new Date().toISOString(), ip: req.ip }, cleaned);
    let current = [];
    try{
      const raw = await fsp.readFile(file, 'utf8');
      current = JSON.parse(raw || '[]');
      if(!Array.isArray(current)) current = [];
    }catch(e){ current = []; }
    current.push(entry);
    try{
      await fsp.writeFile(file, JSON.stringify(current, null, 2), { encoding: 'utf8' });
    }catch(writeErr){
      console.error('Failed to persist booking', writeErr);
      // don't fail the request if we can't persist locally in production (ephemeral fs)
    }

    // Send email notification if SMTP configured (don't fail on email error)
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
