GCP deployment — frontend (GCS) and backend (Cloud Run)
======================================================

This document describes an automated deployment using GitHub Actions that:

- Builds and deploys the Express booking API to Cloud Run.
- Uses GitHub Pages to serve the static frontend (`site/`) rather than syncing to GCS.

Required GCP setup (one-time)
------------------------------

1. Create a GCP project or choose an existing one.
2. Enable APIs:
   - Cloud Run
   - Cloud Build
   - Cloud Storage
   - IAM
3. Create a service account for CI with the following roles:
   - Cloud Run Admin
   - Cloud Build Editor
   - Service Account User

4. Create and download a JSON key for that service account.

GitHub Secrets
--------------
Add these secrets to your repository (Settings → Secrets & variables → Actions):

- `GCP_SA_KEY` — the full JSON value of the service account key file.
- `GCP_PROJECT` — your GCP project ID.
- `GCP_REGION` — region for Cloud Run (e.g. `us-central1`).

Note: The GCS bucket is no longer required because the frontend is published via GitHub Pages. Remove the `GCS_BUCKET` secret if present.

If you want email notifications from the booking API, add these SMTP secrets too:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL`.

How it works
------------

- On push to `master` the workflow authenticates to GCP using the service account key.
- The workflow builds the Node server container using Cloud Build, pushes it to Container Registry, and deploys to Cloud Run.
-- The workflow deploys the backend to Cloud Run. The frontend is published using the existing GitHub Pages workflow which uploads the `site/` folder to GitHub Pages.

Notes
-----
- GitHub Actions must be allowed to use repository secrets.
-- If you previously used a GCS bucket for the frontend, you can switch to GitHub Pages (the repository already contains a Pages workflow). For CDN-backed performance, consider Cloudflare in front of the GitHub Pages site or use a Cloud Run + CDN solution for more advanced setups.
- Cloud Run services must be allowed to be unauthenticated if you expect the public to POST to `/api/booking`. For stricter control, configure authentication and an API gateway.

Custom Domain (CNAME)
---------------------

To serve the frontend on a custom domain (e.g., `www.example.com`), see `CNAME_SETUP.md` for:
- Simple HTTP CNAME setup (fastest to set up).
- Cloud Load Balancer + HTTPS (recommended for production).
- Firebase Hosting integration (simplest with automatic HTTPS).

Troubleshooting
---------------
- If `gcloud builds submit` fails, ensure Cloud Build API is enabled and the service account has Cloud Build Editor.
-- If you previously relied on `gsutil` steps, they are no longer used. For any remaining GCS usage (object storage for other assets), ensure appropriate IAM roles are assigned.
