import fs from "fs";
import fetch from "node-fetch";

const API_KEY = process.env.YT_KEY;
if (!API_KEY) {
  console.error("❌ Missing YT_KEY environment variable");
  process.exit(1);
}

async function getAllItems(playlistId) {
  const allItems = [];
  let pageToken;
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("key", API_KEY);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();

    if (data.items?.length) allItems.push(...data.items);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return allItems;
}

async function run() {
  const files = fs.readdirSync("playlists").filter(f => f.endsWith(".json"));
  fs.mkdirSync("data", { recursive: true });

  for (const file of files) {
    const info = JSON.parse(fs.readFileSync(`playlists/${file}`, "utf-8"));
    if (!info.playlistId) {
      console.warn(`⚠️ No playlistId for ${file}`);
      continue;
    }

    try {
      const items = await getAllItems(info.playlistId);
      const out = `data/${file.replace(".json", "-videos.json")}`;
      fs.writeFileSync(out, JSON.stringify({ items }, null, 2));
      console.log(`✅ ${file}: ${items.length} videos`);
    } catch (err) {
      console.error(`❌ ${file}: ${err.message}`);
    }
  }
}

run();
