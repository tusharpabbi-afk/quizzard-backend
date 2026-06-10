/**
 * Downloads tile photos for the newly added categories into
 * quizzard_app/assets/categories/ (Wikipedia lead images, same source as
 * fetchCategoryImages.js). Run: node scripts/fetchNewCategoryImages.js
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const OUT_DIR = path.join(__dirname, "..", "quizzard_app", "assets", "categories");

// output file -> Wikipedia article whose lead image fits the category.
const TOPICS = {
  "anime.jpg": "Anime",
  "comics.jpg": "Comic book",
  "cartoons.jpg": "Animation",
  "board_games.jpg": "Board game",
  "vehicles.jpg": "Car",
  "gadgets.jpg": "Smartphone",
  "celebrities.jpg": "Hollywood Walk of Fame",
  "mathematics.jpg": "Mathematics",
  "politics.jpg": "Palace of Westminster",
  "books.jpg": "Book",
};

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "quizzard-seed/1.0" } }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on("error", reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "quizzard-seed/1.0" } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
    }).on("error", reject);
  });
}

async function thumbFor(title) {
  const api =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=800&titles=" +
    encodeURIComponent(title);
  const data = await getJson(api);
  const pages = data?.query?.pages || {};
  for (const key of Object.keys(pages)) {
    const src = pages[key]?.thumbnail?.source;
    if (src) return src;
  }
  return null;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [file, title] of Object.entries(TOPICS)) {
    try {
      const url = await thumbFor(title);
      if (!url) { console.warn(`No image for ${title} (${file})`); continue; }
      await download(url, path.join(OUT_DIR, file));
      console.log(`✓ ${file}  <-  ${title}`);
    } catch (e) {
      console.warn(`✗ ${file}: ${e.message}`);
    }
  }
})();
