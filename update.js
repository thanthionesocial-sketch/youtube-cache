/**
 * update.js
 * Fetches all playlists for each category you listed and writes one JSON file per category.
 * Improved: logs reasons for empty playlists.
 * Run inside GitHub Actions (or locally) with YT_API_KEY in the environment.
 */

import fs from "fs";
import fetch from "node-fetch";

const API_KEY = process.env.YT_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing YT_API_KEY environment variable");
  process.exit(1);
}

// ---------------------- CATEGORY → PLAYLIST IDS ----------------------
const categories = {
  action:       ["PLkdhKIzS8nUlPEjE-p4fzZVt-pX96uffL"],
  romantic:     ["PLkdhKIzS8nUnX3_wgi81phau_5PBtnuC1"],
  drama:        ["PLkdhKIzS8nUnT6EIfYIOJqjIC3ifBORKU"],
  "sus-thi":    ["PLkdhKIzS8nUnq-OykjNFBNGWYbB1Pa6eX"],
  horror:       ["PLkdhKIzS8nUlgYeQhV3UY4ibQ0nAGuK1y"],
  fantasy:      ["PLkdhKIzS8nUl9n2wqOJ6zzK2E_Q8qssdm"],
  classic:      ["PLkdhKIzS8nUntEI1ZueSQFdnPt-tGhiWT"],
  family:       ["PLkdhKIzS8nUlMJvw4KJVvgtJioC57omvW"],
  comedy:       ["PLkdhKIzS8nUnmWnY660x7zh9AH6sIB16J"]
};
// ---------------------------------------------------------------------

async function fetchPlaylistItems(playlistId) {
  const base = "https://www.googleapis.com/youtube/v3/playlistItems";
  let pageToken = "";
  const items = [];

  do {
    const url = `${base}?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} for playlist ${playlistId}`);
      return []; // return empty array on HTTP errors
    }

    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      console.warn(`⚠️ No items returned for playlist ${playlistId}. It may be private, invalid, or empty.`);
    }

    items.push(...(data.items || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return items;
}

async function run() {
  for (const [category, playlistIds] of Object.entries(categories)) {
    const output = { playlists: [] };

    for (const pid of playlistIds) {
      console.log(`▶️ Fetching ${category} → ${pid}`);
      const items = await fetchPlaylistItems(pid);

      output.playlists.push({
        id: pid,
        items,
        itemCount: items.length
      });

      if (items.length === 0) {
        console.warn(`⚠️ Playlist ${pid} in category ${category} is empty.`);
      } else {
        console.log(`✅ Fetched ${items.length} items for playlist ${pid}`);
      }
    }

    const filename = `movies-${category}.json`;
    fs.writeFileSync(filename, JSON.stringify(output, null, 2));
    console.log(`💾 Wrote ${filename} (playlists: ${output.playlists.length})\n`);
  }
}

run().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
