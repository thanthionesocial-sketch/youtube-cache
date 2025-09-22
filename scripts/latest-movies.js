import fs from "fs";
import path from "path";

const dataDir = "data";
const feedsDir = path.join(dataDir, "feeds");

// Ensure the feeds directory exists
fs.mkdirSync(feedsDir, { recursive: true });

// Read all movies-*.json files
const files = fs.readdirSync(dataDir)
  .filter(f => f.startsWith("movies-") && f.endsWith(".json"));

let all = [];

files.forEach(f => {
  const filePath = path.join(dataDir, f);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  data.playlists?.forEach(pl => {
    pl.items?.forEach(i => {
      const s = i.snippet;
      all.push({
        id: s.resourceId.videoId,
        title: s.title,
        publishedAt: s.publishedAt,
        thumbnails: s.thumbnails
      });
    });
  });
});

// Sort by published date descending
all.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

// Write top 50 latest movies
const latestFile = path.join(feedsDir, "latest-movies.json");
fs.writeFileSync(latestFile, JSON.stringify(all.slice(0, 50), null, 2), "utf-8");

console.log(`✅ Latest Movies: ${all.length}`);
