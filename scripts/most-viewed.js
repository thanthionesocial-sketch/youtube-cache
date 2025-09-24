// scripts/most-viewed.js
import fs from "fs";
import fetch from "node-fetch";
import { parse, toSeconds } from "iso8601-duration";

const KEY      = process.env.YT_KEY;
const CHANNEL  = process.env.YT_CHANNEL_ID;
const OUTPUT   = "data/feeds/most-viewed.json";

async function run() {
  fs.mkdirSync("data/feeds", { recursive: true });

  // Step 1: get the channel’s Uploads playlist ID
  const chRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL}&key=${KEY}`
  );
  const chData = await chRes.json();
  const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) throw new Error("Could not find uploads playlist");

  // Step 2: collect *all* video IDs from uploads playlist
  const videoIds = [];
  let pageToken = "";
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("playlistId", uploadsId);
    url.searchParams.set("maxResults", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    url.searchParams.set("key", KEY);

    const r = await fetch(url);
    const d = await r.json();
    d.items?.forEach(it => videoIds.push(it.contentDetails.videoId));
    pageToken = d.nextPageToken || "";
  } while (pageToken);

  console.log(`Found ${videoIds.length} total uploads`);

  // Step 3: fetch details + statistics in batches of 50
  const allVideos = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const vUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    vUrl.searchParams.set("part", "snippet,contentDetails,statistics");
    vUrl.searchParams.set("id", batch.join(","));
    vUrl.searchParams.set("key", KEY);

    const vRes = await fetch(vUrl);
    const vData = await vRes.json();

    vData.items?.forEach(v => {
      try {
        const durationSeconds = toSeconds(parse(v.contentDetails.duration));
        const t = v.snippet.thumbnails?.medium || v.snippet.thumbnails?.high;
        if (!t) return;
        const w = t.width || 16, h = t.height || 9;
        // filter: 16:9 ±5%, >10 min
        if (Math.abs(w / h - 16 / 9) < 0.05 && durationSeconds > 600) {
          allVideos.push({
            id: v.id,
            title: v.snippet.title,
            publishedAt: v.snippet.publishedAt,
            thumbnails: v.snippet.thumbnails,
            description: v.snippet.description,
            duration: durationSeconds,
            views: Number(v.statistics.viewCount || 0)
          });
        }
      } catch {
        /* skip bad item */
      }
    });
  }

  // Step 4: sort by lifetime views DESC and keep top 50
  const top = allVideos
    .sort((a, b) => b.views - a.views)
    .slice(0, 50);

  fs.writeFileSync(OUTPUT, JSON.stringify(top, null, 2));
  console.log(`✅ Wrote ${top.length} top-viewed videos to ${OUTPUT}`);
}

run().catch(err => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
