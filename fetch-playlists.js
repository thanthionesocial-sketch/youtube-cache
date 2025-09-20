// fetch-playlists.js
import fs from "fs";
import fetch from "node-fetch";

const API_KEY = process.env.YT_KEY;
if (!API_KEY) {
  console.error("❌ Missing YT_KEY environment variable");
  process.exit(1);
}

// --- Helper to fetch ALL videos from a playlist (handles pagination) ---
async function getAllItems(playlistId) {
  const allItems = [];
  let pageToken = "";

  do {
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems` +
      `?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}` +
      (pageToken ? `&pageToken=${pageToken}` : "");

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();

    if (!data.items) break;
    allItems.push(...data.items);

    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return allItems;
}

// --- Main execution ---
async function run() {
  const files = fs.readdirSync("playlists").filter(f => f.endsWith(".json"));
  fs.mkdirSync("data", { recursive: true });

  for (const file of files) {
    const info = JSON.parse(fs.readFileSync(`playlists/${file}`, "utf-8"));

    if (!info.playlistId) {
      console.warn(`⚠️  No playlistId for ${file}, skipping.`);
      continue;
    }

    try {
      const items = await getAllItems(info.playlistId);
      const outputPath = `data/${file.replace(".json", "-videos.json")}`;

      fs.writeFileSync(outputPath, JSON.stringify({ items }, null, 2));
      console.log(`✅ ${file}: saved ${items.length} videos`);
    } catch (err) {
      console.error(`❌ Error fetching ${file}:`, err.message);
    }
  }
}

run();
