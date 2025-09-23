import fs from "fs";
import fetch from "node-fetch";

const KEY = process.env.YT_KEY;
const CHANNEL = process.env.YT_CHANNEL_ID;

async function run() {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", CHANNEL);
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", "50");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", KEY);

  const res = await fetch(url);
  const data = await res.json();

  const items = data.items.map(v => ({
    id: v.id.videoId,
    title: v.snippet.title,
    publishedAt: v.snippet.publishedAt,
    thumbnails: v.snippet.thumbnails,
    description: v.snippet.description
  }))
  // Filter only 16:9 videos
  .filter(v => {
    const t = v.thumbnails?.medium || v.thumbnails?.high;
    if(!t) return false;
    const w = t.width || 16;
    const h = t.height || 9;
    return Math.abs(w/h - 16/9) < 0.05;
  });

  fs.writeFileSync("data/feeds/recently.json", JSON.stringify(items, null, 2));
  console.log(`✅ Recently Added: ${items.length}`);
}

run();
