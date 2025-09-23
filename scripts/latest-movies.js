import fs from "fs";
import path from "path";
import { parse, toSeconds } from "iso8601-duration"; // Add this dependency

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
      const duration = i.contentDetails?.duration; // e.g., "PT15M30S"
      if (!duration) return; // Skip if no duration

      // Parse duration and convert to seconds
      try {
        const durationSeconds = toSeconds(parse(duration));
        if (durationSeconds > 600) { // Filter for > 10 minutes (600 seconds)
          all.push({
            id: s.resourceId.videoId,
            title: s.title,
            publishedAt: s.publishedAt,
            thumbnails: s.thumbnails,
            duration: durationSeconds // Optional: include duration in output
          });
        }
      } catch (err) {
        console.warn(`⚠️ Skipping video ${s.resourceId.videoId}: Invalid duration format`);
      }
    });
  });
});

// Sort by published date descending
all.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

// Write top 50 latest movies
const latestFile = path.join(feedsDir, "latest-movies.json");
fs.writeFileSync(latestFile, JSON.stringify(all.slice(0, 50), null, 2), "utf-8");

console.log(`✅ Latest Movies (>10 min): ${all.length}`);
