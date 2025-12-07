Custom Domain Setup for GCS Bucket (CNAME)
============================================

This guide explains how to set up a custom domain (via CNAME) for your GCS bucket hosting the Grasshopper Lodge frontend.

Prerequisites
-------------

- A domain registered with a registrar (e.g., Namecheap, GoDaddy, Route 53, Google Domains).
- An existing GCS bucket already set up as a static website (from the GitHub Actions deployment).
- Permission to manage DNS records for your domain.

High-level overview
--------------------

1. Verify domain ownership with Google (optional but recommended for SSL/HTTPS).
2. Create a CNAME record pointing your domain to the GCS bucket's `c.storage.googleapis.com` endpoint.
3. Configure the GCS bucket to accept requests on your custom domain.
4. Optionally use Cloud CDN or Cloud Load Balancer for better performance and HTTPS.

Option A: Using a CNAME (Simple, HTTP only)
--------------------------------------------

This is the quickest method for serving content over HTTP; it does NOT provide HTTPS.

1. **Get your GCS bucket endpoint:**
   - If your bucket is named `my-site-bucket`, the endpoint is `my-site-bucket.storage.googleapis.com`.

2. **Add a CNAME record in your DNS provider:**
   - Host: `www` (or your subdomain, e.g., `site`)
   - Type: CNAME
   - Value: `c.storage.googleapis.com`

   Example (in Route 53, Google Domains, etc.):
   ```
   www.example.com CNAME c.storage.googleapis.com
   ```

3. **Configure the GCS bucket to serve on your custom domain:**
   - In GCS console, go to Buckets → your bucket → Permissions.
   - Ensure the bucket allows public read access (or use signed URLs).
   - Add the custom domain as a "Custom domain" in Cloud Storage settings (if available in your console version).

4. **Test:**
   ```bash
   curl http://www.example.com
   ```

**Limitation:** This method serves over HTTP only. Modern browsers will flag it as insecure.

---

Option B: Using Cloud CDN + Load Balancer (Recommended, HTTPS)
--------------------------------------------------------------

This approach provides HTTPS, better performance via CDN, and a professional setup.

1. **Create a Cloud Load Balancer:**
   ```bash
   # (Use the GCP Console or gcloud CLI)
   gcloud compute backend-buckets create grasshopper-lodge-backend \
     --gcs-bucket-name=my-site-bucket

   gcloud compute url-maps create grasshopper-lodge-lb \
     --default-service=grasshopper-lodge-backend

   gcloud compute ssl-certificates create grasshopper-lodge-cert \
     --domains=www.example.com,example.com \
     --global

   gcloud compute target-https-proxies create grasshopper-lodge-proxy \
     --url-map=grasshopper-lodge-lb \
     --ssl-certificates=grasshopper-lodge-cert

   gcloud compute forwarding-rules create grasshopper-lodge-rule \
     --global \
     --target-https-proxy=grasshopper-lodge-proxy \
     --address=grasshopper-lodge-ip \
     --ports=443
   ```

2. **Point your domain to the load balancer IP:**
   - Get the IP of the load balancer:
     ```bash
     gcloud compute addresses describe grasshopper-lodge-ip --global
     ```
   - Create an A record in your DNS pointing to that IP:
     ```
     www.example.com A <LOAD_BALANCER_IP>
     example.com   A <LOAD_BALANCER_IP>
     ```

3. **Enable Cloud CDN (optional but recommended):**
   - In the GCP Console, go to Cloud CDN → Caches.
   - Create a new cache and attach it to your backend bucket.
   - Set cache TTL and policies as needed.

4. **Test:**
   ```bash
   curl https://www.example.com
   ```

---

Option C: Using Firebase Hosting (Simplest with HTTPS)
-------------------------------------------------------

If you prefer a simpler setup with automatic HTTPS:

1. Initialize Firebase in your project:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   ```

2. Deploy the `site/` folder:
   ```bash
   firebase deploy --only hosting
   ```

3. Link a custom domain:
   - In Firebase Console → Hosting → Custom domains.
   - Add your domain and follow the DNS verification steps.
   - Firebase will automatically provision an SSL certificate via Let's Encrypt.

---

DNS Record Examples
-------------------

**Option A (CNAME, HTTP):**
```
www       CNAME  c.storage.googleapis.com
```

**Option B (Load Balancer, HTTPS):**
```
www       A      <LOAD_BALANCER_IP>
```

**Option C (Firebase, HTTPS):**
Follow Firebase's console prompts for DNS records (usually an A record or TXT verification).

---

Troubleshooting
---------------

- **403 Forbidden:** Ensure the bucket has public read access and the website configuration is set (`gsutil web set`).
- **404 on custom domain:** Verify the CNAME or A record is correctly configured and propagated (may take a few minutes).
- **Mixed content warning:** Use HTTPS (Option B or C) if you have any insecure resources.
- **Certificate errors:** For Option B, ensure the SSL certificate domain matches your custom domain exactly.

---

Recommended: Use Option B (Cloud Load Balancer + HTTPS) or Option C (Firebase Hosting) for production.
