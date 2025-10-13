import "dotenv/config";
import fs from "fs";
import path from "path";
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

    if (Array.isArray(data.items) && data.items.length) {
      const flatItems = data.items.map((item) => {
        const s = item.snippet;
        return {
          id: s?.resourceId?.videoId || "",
          title: s?.title || "",
          description: s?.description || "",
          publishedAt: s?.publishedAt || "",
          thumbnail:
            s?.thumbnails?.maxres?.url ||
            s?.thumbnails?.high?.url ||
            s?.thumbnails?.medium?.url ||
            s?.thumbnails?.default?.url ||
            "",
          playlistId: playlistId,
          channelTitle: s?.channelTitle || "",
        };
      });
      allItems.push(...flatItems);
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return allItems;
}

async function run() {
  const playlistsDir = path.join("playlists", "serials");
  const outputDir = path.join("data", "serials");

  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs
    .readdirSync(playlistsDir)
    .filter((f) => f.toLowerCase().endsWith(".json"));

  for (const file of files) {
    const fullPath = path.join(playlistsDir, file);
    const info = JSON.parse(fs.readFileSync(fullPath, "utf8"));

    if (!info.playlistId) {
      console.warn(`⚠️ No playlistId found in ${file}`);
      continue;
    }

    try {
      const items = await getAllItems(info.playlistId);

      // Output flattened JSON directly
      const outFile = path.join(
        outputDir,
        file.replace(/\.json$/i, "-videos.json")
      );
      fs.writeFileSync(outFile, JSON.stringify(items, null, 2));
      console.log(`✅ ${file}: ${items.length} flattened videos saved`);
    } catch (err) {
      console.error(`❌ ${file}: ${err.message}`);
    }
  }
}

run().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
