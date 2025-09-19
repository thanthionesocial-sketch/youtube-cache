/**
 * update.js
 * Fetches all playlists for each category and writes one JSON file per category.
 * Logs empty playlists and API errors.
 * Requires YT_API_KEY in environment.
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
  action: ["PLkdhKIzS8nUlPEjE-p4fzZVt-pX96uffL"],
  romantic: ["PLkdhKIzS8nUnX3_wgi81phau_5PBtnuC1"],
  drama: ["PLkdhKIzS8nUnT6EIfYIOJqjIC3ifBORKU"],
  "sus_thriller": ["PLkdhKIzS8nUnq-OykjNFBNGWYbB1Pa6eX"], // replaced - with _
  horror: ["PLkdhKIzS8nUlgYeQhV3UY4ibQ0nAGuK1y"],
  fantasy: ["PLkdhKIzS8nUl9n2wqOJ6zzK2E_Q8qssdm"],
  classic: ["PLkdhKIzS8nUntEI1ZueSQFdnPt-tGhiWT"],
  family: ["PLkdhKIzS8nUlMJvw4KJVvgtJioC57omvW"],
  comedy: ["PLkdhKIzS8nUnmWnY660x7zh9AH6sIB16J"],
  devotional: [
    "PLkdhKIzS8nUnRFvWYOof1qqEumGH3HTIX",
    "PLkdhKIzS8nUmqiZSk3LcTGelwDfHeiq15"
  ],
  "women_centric": ["PLkdhKIzS8nUkB8STcvvnkJ0JPIXXSEhZw"],
  "family_drama": ["PLkdhKIzS8nUnLUTCqe2gY4UgpEskSXJJd"],
  historical: ["PLkdhKIzS8nUn56ebMPrAiQNzhfEQAhLDk"],
  "fantasy_extra": ["PLkdhKIzS8nUkiQuxNXiORoaTg5p1BBjbr"],
  "web_series": ["PLkdhKIzS8nUm1zt3nTqNGadSlxuHda6Vp"]
};
// ---------------------------------------------------------------------

async function fetchPlaylistItems(playlistId) {
  const base = "https://www.googleapis.com/youtube/v3/playlistItems";
  let pageToken = "";
  const items = [];

  try {
    do {
      const url = `${base}?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        console.error(`❌ HTTP ${res.status} for playlist ${playlistId}:`, data.error?.message);
        break;
      }

      if (!data.items || data.items.length === 0) {
        console.warn(`⚠️ Playlist ${playlistId} returned no items.`);
      }

      items.push(...(data.items || []));
      pageToken = data.nextPageToken || "";
    } while (pageToken);
  } catch (err) {
    console.error(`❌ Failed to fetch playlist ${playlistId}:`, err.message);
  }

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
        itemCount: items.length,
        items
      });
    }

    const filename = `movies-${category}.json`;
    fs.writeFileSync(filename, JSON.stringify(output, null, 2));
    console.log(`💾 Wrote ${filename}`);
  }
}

run().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
