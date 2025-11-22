#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const sharp = require('sharp');

// Usage:
//   node scripts/generate-images.js --url "https://.../img-0080_orig.jpg"
// or place a local file at site/assets/images/hero-source.jpg and run without --url

const OUT_DIR = path.resolve(__dirname, '..', 'site', 'assets', 'images');
const DEFAULT_URL = 'https://www.grasshopperlodge.com/uploads/9/4/0/6/9406342/img-0080_orig.jpg';

async function downloadToFile(url, dest) {
  console.log('Downloading', url);
  // Try with a browser-like User-Agent and Referer to avoid simple 403 blocks
  const headersA = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.grasshopperlodge.com/'
  };
  let res = await fetch(url, { headers: headersA });
  if (!res.ok && res.status === 403) {
    console.warn(`Download returned 403; retrying with alternate headers...`);
    // Try a slightly different UA
    const headersB = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      'Referer': 'https://www.grasshopperlodge.com/'
    };
    res = await fetch(url, { headers: headersB });
  }

  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const buffer = await res.buffer();
  fs.writeFileSync(dest, buffer);
}

async function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function generate(srcPath) {
  await ensureOutDir();
  const sizes = [400, 800, 1600, 1800];
  const baseName = 'hero';
  for (const w of sizes) {
    const outJpg = path.join(OUT_DIR, `${baseName}-${w}.jpg`);
    console.log(`Generating ${outJpg} (${w}px)`);
    await sharp(srcPath).resize({ width: w }).jpeg({ quality: 82 }).toFile(outJpg);
    // also write webp
    const outWebp = path.join(OUT_DIR, `${baseName}-${w}.webp`);
    await sharp(srcPath).resize({ width: w }).webp({ quality: 80 }).toFile(outWebp);
  }
  // copy a large 1800 as the default hero-1800.jpg
  const src1800 = path.join(OUT_DIR, `${baseName}-1800.jpg`);
  const heroDefault = path.join(OUT_DIR, `${baseName}-1800.jpg`);
  if (!fs.existsSync(heroDefault) && fs.existsSync(src1800)) {
    fs.copyFileSync(src1800, heroDefault);
  }
  console.log('Image generation complete. Files written to', OUT_DIR);
}

(async function main(){
  try{
    const argUrlIndex = process.argv.indexOf('--url');
    let srcLocal = path.join(OUT_DIR, 'hero-source.jpg');
    if (argUrlIndex !== -1 && process.argv[argUrlIndex+1]){
      const url = process.argv[argUrlIndex+1];
      await ensureOutDir();
      await downloadToFile(url, srcLocal);
    } else if (!fs.existsSync(srcLocal)){
      console.log('No --url provided and no local hero-source.jpg found in', OUT_DIR);
      console.log('Falling back to downloading the default hero image from the live site.');
      await ensureOutDir();
      await downloadToFile(DEFAULT_URL, srcLocal);
    } else {
      console.log('Using existing local file', srcLocal);
    }
    await generate(srcLocal);
  } catch (err){
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
