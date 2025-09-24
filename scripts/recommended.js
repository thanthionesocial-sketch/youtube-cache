// scripts/recommended.js
import fs from "fs";
import fetch from "node-fetch";
import { parse, toSeconds } from "iso8601-duration";

const KEY     = process.env.YT_KEY;
const CHANNEL = process.env.YT_CHANNEL_ID;
const OUTPUT  = "data/feeds/recommended.json";

async function run() {
  fs.mkdirSync("data/feeds", { recursive: true });

  // 1️⃣ Get all public playlists of the channel
  const playlists = [];
  let nextPage = "";
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlists");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("channelId", CHANNEL);
    url.searchParams.set("maxResults", "50");
    if (nextPage) url.searchParams.set("pageToken", nextPage);
    url.searchParams.set("key", KEY);

    const r = await fetch(url);
    const d = await r.json();
    d.items?.forEach(p => playlists.push({ id: p.id, title: p.snippet.title }));
    nextPage = d.nextPageToken || "";
  } while (nextPage);

  if (!playlists.length) {
    console.log("⚠️ No playlists found");
    fs.writeFileSync(OUTPUT, JSON.stringify([], null, 2));
    return;
  }

  console.log(`Found ${playlists.length} playlists`);

  // 2️⃣ For each playlist, find its top-viewed eligible video
  const recommended = [];
  for (const pl of playlists) {
    const vids = await fetchPlaylistVideos(pl.id);
    if (!vids.length) continue;

    // Fetch details + stats in batches of 50
    const details = await fetchVideoDetails(vids);
    const filtered = details.filter(filterVideo);
    if (!filtered.length) continue;

    // Pick the most viewed from this playlist
    filtered.sort((a, b) => b.views - a.views);
    const top = filtered[0];
    recommended.push({
      ...top,
      playlistId: pl.id,
      playlistTitle: pl.title
    });
  }

  // Shuffle the final list (optional)
  recommended.sort(() => 0.5 - Math.random());

  fs.writeFileSync(OUTPUT, JSON.stringify(recommended, null, 2));
  console.log(`✅ Recommended videos written: ${recommended.length}`);
}

/* ---------- Helpers ---------- */

async function fetchPlaylistVideos(playlistId) {
  const ids = [];
  let next = "";
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    if (next) url.searchParams.set("pageToken", next);
    url.searchParams.set("key", KEY);

    const r = await fetch(url);
    const d = await r.json();
    d.items?.forEach(it => ids.push(it.contentDetails.videoId));
    next = d.nextPageToken || "";
  } while (next);
  return ids;
}

async function fetchVideoDetails(videoIds) {
  const out = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails,statistics");
    url.searchParams.set("id", batch.join(","));
    url.searchParams.set("key", KEY);

    const r = await fetch(url);
    const d = await r.json();

    d.items?.forEach(v => {
      try {
        const durationSeconds = toSeconds(parse(v.contentDetails.duration));
        out.push({
          id: v.id,
          title: v.snippet.title,
          publishedAt: v.snippet.publishedAt,
          thumbnails: v.snippet.thumbnails,
          description: v.snippet.description,
          duration: durationSeconds,
          views: Number(v.statistics.viewCount || 0)
        });
      } catch { /* skip bad item */ }
    });
  }
  return out;
}

function filterVideo(v) {
  if (!v) return false;
  const t = v.thumbnails?.medium || v.thumbnails?.high;
  if (!t) return false;
  const w = t.width || 16, h = t.height || 9;
  return Math.abs(w / h - 16 / 9) < 0.05 && v.duration > 600;
}

run().catch(err => {
  console.error("❌ recommended.js failed:", err);
  process.exit(1);
});
