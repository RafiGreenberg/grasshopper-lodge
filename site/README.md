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

   - The site supports Formspree AJAX submits (will send JSON/accept header) when you set the `action` to your Formspree endpoint.

4. Test locally
   - Open `site/index.html` in a browser. To test the Formspree submit locally, you will need an internet connection to Formspree.

Deployment
----------
- You can host these static files on GitHub Pages, Netlify, Vercel (static), or any static host.
- Netlify quick deploy: connect your repository and set the publish directory to `site` (or include the provided `netlify.toml`).
- GitHub Pages (via Actions): there is a workflow that can publish the `site/` folder to `gh-pages` branch automatically when you push to `main`.

Troubleshooting GitHub Pages 404
--------------------------------
If you see a 404 at `https://<username>.github.io/<repo>/` after pushing changes, try the following checklist:

- Confirm the deploy workflow ran successfully and created a `gh-pages` branch. Check Actions > (Deploy Site to GitHub Pages) for a successful run.
- In the repository Settings → Pages, ensure the Source is set to the `gh-pages` branch (or select the `gh-pages` branch if it's not already selected).
- The workflow in this repo publishes the `site/` folder to the `gh-pages` branch. If your default branch is `master` the workflow triggers on pushes to `master`. If you use `main`, update `.github/workflows/deploy.yml` to trigger on `main`.
- After a successful deploy, GitHub Pages may need a minute to serve the site. If it still 404s after a few minutes, verify the `gh-pages` branch contains the expected static files.

If you want, I can adjust the workflow to trigger on the branch you use (for example `master`) or help you enable Pages for the `gh-pages` branch in repository settings.

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

Automated hero image generator (Node + sharp)
-------------------------------------------
I added a helper script that downloads the live hero image and creates responsive variants into `site/assets/images/`.

Steps to run it locally:

```bash
# from repo root
npm install
npm run generate-images -- --url "https://www.grasshopperlodge.com/uploads/9/4/0/6/9406342/img-0080_orig.jpg"
```

This writes `hero-400.jpg`, `hero-800.jpg`, `hero-1600.jpg`, `hero-1800.jpg` (and matching `.webp`) into `site/assets/images/` and the site will use `hero-1800.jpg` as the hero background. If you omit `--url`, the script will try to use a local `hero-source.jpg` file (if present) or fall back to downloading the same live image.

If automatic download fails with a `403` (for example the remote host blocks programmatic requests), do one of the following:

- Manually download the image in your browser and save it to `site/assets/images/hero-source.jpg`, then run the generator without `--url` so it uses the local file:

```bash
# after placing hero-source.jpg into site/assets/images
npm run generate-images
```

- Or host the image somewhere you control (or use a CDN) and run the generator with `--url "https://your-host/hero.jpg"`.

The generator now attempts to fetch with browser-like `User-Agent` and `Referer` headers and will retry once with an alternate UA, but some servers still block automated downloads; the manual fallback above is the most reliable remedy.

If you'd like, I can:
- Add responsive `srcset` + lazy-loading for the gallery
- Wire a small Node/Express webhook receiver for form submissions
- Create a GitHub Pages or Netlify deployment configuration

