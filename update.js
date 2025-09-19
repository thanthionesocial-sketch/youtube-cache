/**
 * update.js
 * Fetches all playlists for each category and writes one JSON file per category.
 * Run inside GitHub Actions (or locally) with YT_API_KEY in the environment.
 */

import fs from "fs";

// Node 18+ has fetch built-in
const API_KEY = process.env.YT_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing YT_API_KEY environment variable");
  process.exit(1);
}

// ---------------------- CATEGORY → PLAYLIST IDS ----------------------
const categories = {
  "action": ["PLkdhKIzS8nUlPEjE-p4fzZVt-pX96uffL"],
  "classic": ["PLkdhKIzS8nUntEI1ZueSQFdnPt-tGhiWT"],
  "comedy": ["PLkdhKIzS8nUnmWnY660x7zh9AH6sIB16J"],
  "devotional": [
    "PLkdhKIzS8nUnRFvWYOof1qqEumGH3HTIX",
    "PLkdhKIzS8nUmqiZSk3LcTGelwDfHeiq15",
    "PLkdhKIzS8nUkJs2k7Woxdk4BWl0pdKhyf",
    "PLkdhKIzS8nUkHry-qqPqRXcz1UJbsVQ6F",
    "PLkdhKIzS8nUnGpZ4-gGLum_etE3o7-NAs"
  ],
  "drama": ["PLkdhKIzS8nUnT6EIfYIOJqjIC3ifBORKU"],
  "family-drama": [
    "PLkdhKIzS8nUnLUTCqe2gY4UgpEskSXJJd",
    "PLkdhKIzS8nUnVTxf3BUrU_DQiGXTh3I0T",
    "PLkdhKIzS8nUkj0HfIE5JZu911RK0DmU3V",
    "PLkdhKIzS8nUkHJEK9tlrf4oMbFMCqDbAp",
    "PLkdhKIzS8nUlMfh7Pe_4YM3o-9JpsBhN_"
  ],
  "family": ["PLkdhKIzS8nUlMJvw4KJVvgtJioC57omvW"],
  "fantasy-extra": [
    "PLkdhKIzS8nUkiQuxNXiORoaTg5p1BBjbr",
    "PLkdhKIzS8nUm7XAvYNcvKhsK0HIIBCtho",
    "PLkdhKIzS8nUlNgqwC90JMKKH07ygsAikd",
    "PLkdhKIzS8nUlTAVTKkFrurUmv8rYUqSHe"
  ],
  "fantasy": ["PLkdhKIzS8nUl9n2wqOJ6zzK2E_Q8qssdm"],
  "historical": [
    "PLkdhKIzS8nUn56ebMPrAiQNzhfEQAhLDk",
    "PLkdhKIzS8nUknzX9JXNZGnNge6fZ--jiy",
    "PLkdhKIzS8nUkwK7UuNEMNVbyVQj4eWd-T",
    "PLkdhKIzS8nUleBlrj9BtMY-_nbWGO2WdR"
  ],
  "horror": ["PLkdhKIzS8nUlgYeQhV3UY4ibQ0nAGuK1y"],
  "romantic": ["PLkdhKIzS8nUnX3_wgi81phau_5PBtnuC1"],
  "sus-thi": ["PLkdhKIzS8nUnq-OykjNFBNGWYbB1Pa6eX"],
  "web-series": [
    "PLkdhKIzS8nUm1zt3nTqNGadSlxuHda6Vp",
    "PLkdhKIzS8nUnNobktoctZLgyNKWa0-feT",
    "PLkdhKIzS8nUmubf0uVOYR0LsTsdOAsZN0",
    "PLkdhKIzS8nUnpzkgeGJlLLi-7Xwdfj5dE",
    "PLkdhKIzS8nUkZ9WfAPiBzBEQh7Q43_bd1",
    "PLkdhKIzS8nUmJHJsagYRDewAFQITz3Q2U"
  ],
  "women-centric": [
    "PLkdhKIzS8nUkB8STcvvnkJ0JPIXXSEhZw",
    "PLkdhKIzS8nUmPv6Pv2bF-r8_-YljKX8s8",
    "PLkdhKIzS8nUlA55Bfwj9dbSgPhY60CT9K",
    "PLkdhKIzS8nUm8ofyxuLagWIrx4hCUVaKg",
    "PLkdhKIzS8nUlpARmUPTlQz-3BShoax9WV",
    "PLkdhKIzS8nUk-Ue0gwpRxL6IE1E_4fsP3"
  ]
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
      console.warn(`⚠️ Failed fetching playlist ${playlistId}: HTTP ${res.status}`);
      break;
    }
    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      console.log(`ℹ️ Playlist ${playlistId} returned 0 items`);
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
      output.playlists.push({ id: pid, items });
    }

    const filename = `movies-${category}.json`;
    fs.writeFileSync(filename, JSON.stringify(output, null, 2));
    console.log(`💾 Wrote ${filename} (total items: ${output.playlists.reduce((sum, p) => sum + p.items.length, 0)})`);
  }
}

run().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
