GCP deployment — frontend (GCS) and backend (Cloud Run)
======================================================

This document describes an automated deployment using GitHub Actions that:

- Builds and deploys the Express booking API to Cloud Run.
- Syncs the `site/` static folder to a Google Cloud Storage bucket for static hosting.

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
   - Storage Admin
   - Cloud Build Editor
   - Service Account User

4. Create and download a JSON key for that service account.

GitHub Secrets
--------------
Add these secrets to your repository (Settings → Secrets & variables → Actions):

- `GCP_SA_KEY` — the full JSON value of the service account key file.
- `GCP_PROJECT` — your GCP project ID.
- `GCP_REGION` — region for Cloud Run (e.g. `us-central1`).
- `GCS_BUCKET` — the name of the bucket to host the static site (must already exist).

If you want email notifications from the booking API, add these SMTP secrets too:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL`.

How it works
------------

- On push to `master` the workflow authenticates to GCP using the service account key.
- The workflow builds the Node server container using Cloud Build, pushes it to Container Registry, and deploys to Cloud Run.
- The workflow syncs `site/` to the configured GCS bucket and sets the bucket as a static website.

Notes
-----
- GitHub Actions must be allowed to use repository secrets.
- You will need to create the GCS bucket manually and optionally configure a custom domain and Cloud CDN if you want a fast CDN-backed site.
- Cloud Run services must be allowed to be unauthenticated if you expect the public to POST to `/api/booking`. For stricter control, configure authentication and an API gateway.

Troubleshooting
---------------
- If `gcloud builds submit` fails, ensure Cloud Build API is enabled and the service account has Cloud Build Editor.
- If `gsutil` calls fail, ensure the service account has Storage Admin rights and the bucket name is correct.
