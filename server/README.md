# Grasshopper Lodge — Server

This folder contains the booking API used by the Grasshopper Lodge site.

Required environment variables (set in Cloud Run or locally):

- `PORT` (optional) — port to listen on (default 3000 locally, Cloud Run sets 8080).
- `RECAPTCHA_SECRET` (recommended) — your Google reCAPTCHA v3 secret key. When set, the server will verify incoming booking requests and reject suspicious traffic.
- `RECAPTCHA_MIN_SCORE` (optional) — minimum acceptable score for v3 tokens (default `0.45`).
- `ALLOWED_ORIGINS` (optional) — comma-separated list of allowed CORS origins. Defaults include `http://localhost:3000` and `https://demo.grasshopperlodge.com`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (optional) — SMTP settings for notification emails.
- `NOTIFY_EMAIL` (optional) — destination address for booking notifications (defaults to `SMTP_USER`).

Frontend setup:

- Add your reCAPTCHA site key (v3) to the booking page by replacing the placeholder in `site/booking.html`:

```html
<meta name="recaptcha-site-key" content="RECAPTCHA_SITE_KEY">
```

Replace `RECAPTCHA_SITE_KEY` with your actual site key before deploying the static site to GitHub Pages (or use your own build step to inject it).

Deploy notes:

- The server uses `node-fetch` to verify reCAPTCHA tokens; ensure `npm install` (or `npm ci`) runs during your build.
- Cloud Run: add `RECAPTCHA_SECRET` and any SMTP credentials as secrets/env vars in the Cloud Run service.

Security:

- The server enforces rate limiting and request size limits. If you see valid users blocked unexpectedly, adjust `RECAPTCHA_MIN_SCORE` or your `ALLOWED_ORIGINS`.
Booking API
============

This repository includes a lightweight Express server to accept booking requests from the static site and notify you by email.

Features:
- POST /api/booking accepts form submissions (application/x-www-form-urlencoded or JSON).
- Stores submissions in `data/bookings.json`.
- Sends notification emails if SMTP settings are provided in environment variables.

Quick start (local):

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in SMTP values if you want email notifications:

   ```bash
   cp .env.example .env
   # edit .env and set SMTP_HOST, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL
   ```

3. Start the server:

   ```bash
   npm run start-server
   ```

4. The static site should POST to `http://localhost:3000/api/booking` when you submit the booking form (the form action is `/api/booking`, so if you run the server locally, open the static site at `http://localhost:3000` or use a static server and the API server on port 3000; set up a proxy or run both on the same origin).

Deployment notes:
- You can deploy this server to any Node-capable host (Heroku, Render, Railway, Fly, Vercel Serverless Functions with minor changes).
- On platforms like Vercel you may want to convert this to a serverless function (API route) rather than a long-running Express server.

Security:
- Protect the `/api/booking` endpoint if needed (rate limiting, captcha) before exposing it publicly.
