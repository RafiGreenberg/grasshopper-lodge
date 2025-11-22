# Grasshopper Lodge — Static Website

This is a simple static website for a cabin rental in the Ocala National Forest. It includes:

- `index.html` — Homepage with image gallery and lightbox
- `rates.html` — Rates table and embedded Google Calendar for availability
- `booking.html` — Booking request form (configured to use Formspree by default)
- `assets/css/styles.css` — Basic styles
- `assets/js/main.js` — Lightbox and optional form AJAX submit logic
- `assets/images/` — Put your images here (see `assets/images/README.txt`)

Quick setup
-----------
1. Copy your photos into `assets/images/` and name them to match the files referenced (or update `index.html` to point to your filenames).

2. Google Calendar embed (availability)
   - Create a calendar or use an existing calendar in Google Calendar.
   - Make the calendar public (Calendar Settings → Access permissions → "Make available to public").
   - In Calendar Settings → Integrate calendar → copy the "Embed code" URL (the `src` query in the iframe).
   - Replace the `src` in `rates.html` iframe with your calendar embed URL.

3. Booking form
   - The form in `booking.html` posts to Formspree by default: `https://formspree.io/f/your-form-id`.
   - Create a free form at https://formspree.io/ and replace the `action` value with the endpoint they give you.
   - Alternatively use Netlify Forms (add `data-netlify="true"` to the form and deploy to Netlify) or point the `action` to your own booking backend.

   - Testing the form locally: open `booking.html` and check the "Test submit" checkbox to POST the form to `https://httpbin.org/post` (no configuration required). The site also supports Formspree AJAX submits (will send JSON/accept header) when you set the `action` to your Formspree endpoint.

4. Test locally
   - Open `site/index.html` in a browser. To test the Formspree submit locally, you will need an internet connection to Formspree.

Deployment
----------
- You can host these static files on GitHub Pages, Netlify, Vercel (static), or any static host.
- Netlify quick deploy: connect your repository and set the publish directory to `site` (or include the provided `netlify.toml`).
- GitHub Pages (via Actions): there is a workflow that can publish the `site/` folder to `gh-pages` branch automatically when you push to `main`.

Files added for deployment:
- `netlify.toml` — config to publish the `site/` folder
- `.github/workflows/deploy.yml` — GitHub Actions workflow to publish `site/` to GitHub Pages using `peaceiris/actions-gh-pages`.

See the example commands below to generate images and test locally.

Customizations you might want
----------------------------
- Add `srcset` images for responsive images.
- Replace placeholder text, rates, and policies.
- Add payment handling or an availability check integration.

Generating responsive images (example using ImageMagick + cwebp)
----------------------------------------------------------------
Run these commands from the `site/assets/images` folder (install ImageMagick and webp tools):

```bash
# produce 400px and 800px JPEGs and a 1600px larger JPEG
magick convert image1.jpg -resize 400x image1-400.jpg
magick convert image1.jpg -resize 800x image1-800.jpg
magick convert image1.jpg -resize 1600x image1-1600.jpg

# optional: create a large 1800px image used by the lightbox
magick convert image1.jpg -resize 1800x image1-1800.jpg

# create webp versions
cwebp -q 80 image1-800.jpg -o image1-800.webp
cwebp -q 80 image1-1600.jpg -o image1-1600.webp
```

If you prefer Node tooling, you can use `sharp` in a small script to generate the same sizes.

If you'd like, I can:
- Add responsive `srcset` + lazy-loading for the gallery
- Wire a small Node/Express webhook receiver for form submissions
- Create a GitHub Pages or Netlify deployment configuration

