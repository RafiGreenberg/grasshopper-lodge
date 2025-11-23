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
