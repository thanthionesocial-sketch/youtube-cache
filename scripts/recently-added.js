import fs from "fs";
import fetch from "node-fetch";
import { parse, toSeconds } from "iso8601-duration";

const KEY = process.env.YT_KEY;
const CHANNEL = process.env.YT_CHANNEL_ID;
const OUTPUT_FILE = "data/feeds/recently.json"; // ✅ Output path

async function fetchRecentlyAdded() {
  if (!KEY || !CHANNEL) {
    console.error("❌ Missing YT_KEY or YT_CHANNEL_ID environment variables");
    return;
  }

  // Fetch recent videos from the channel
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", CHANNEL);
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "50");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("key", KEY);

  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.items || searchData.items.length === 0) {
    console.log("⚠️ No videos found");
    fs.mkdirSync("data/feeds", { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
    return;
  }

  // Get video IDs
  const videoIds = searchData.items.map(v => v.id.videoId);

  // Fetch video durations
  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "contentDetails");
  videosUrl.searchParams.set("id", videoIds.join(","));
  videosUrl.searchParams.set("key", KEY);

  const videosRes = await fetch(videosUrl);
  const videosData = await videosRes.json();

  const durationMap = new Map(videosData.items.map(v => [v.id, v.contentDetails.duration]));

  // Process and filter videos
  const items = searchData.items
    .map(v => {
      const durationISO = durationMap.get(v.id.videoId);
      if (!durationISO) return null;

      try {
        const durationSec = toSeconds(parse(durationISO));
        return {
          id: v.id.videoId,
          title: v.snippet.title,
          publishedAt: v.snippet.publishedAt,
          description: v.snippet.description,
          duration: durationSec,
          thumbnails: v.snippet.thumbnails
        };
      } catch {
        return null;
      }
    })
    .filter(v => {
      if (!v) return false;
      const t = v.thumbnails.maxres || v.thumbnails.high || v.thumbnails.medium || v.thumbnails.default;
      if (!t) return false;
      const w = t.width || 16;
      const h = t.height || 9;
      const aspectRatio = w / h;
      return Math.abs(aspectRatio - 16 / 9) < 0.05 && v.duration > 600;
    })
    .slice(0, 50); // Keep top 50

  // Save output
  fs.mkdirSync("data/feeds", { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(items, null, 2));
  console.log(`✅ Recently Added (>10 min, 16:9): ${items.length}`);
}

fetchRecentlyAdded().catch(err => console.error(`❌ Error: ${err.message}`));
