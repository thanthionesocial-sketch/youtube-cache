import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { parse, toSeconds } from "iso8601-duration";

const KEY = process.env.YT_KEY;
const CHANNEL = process.env.YT_CHANNEL_ID;

if (!KEY || !CHANNEL) {
  console.error("❌ Missing YT_KEY or YT_CHANNEL_ID environment variable.");
  process.exit(1);
}

const feedsDir = path.join("data", "feeds");
fs.mkdirSync(feedsDir, { recursive: true });

async function run() {
  try {
    // Fetch recent videos
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
      fs.writeFileSync(path.join(feedsDir, "recently.json"), JSON.stringify([], null, 2));
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

    // Map durations to video IDs
    const durationMap = new Map(
      videosData.items.map(v => [v.id, v.contentDetails.duration])
    );

    // Process and filter videos
    const items = searchData.items
      .map(v => {
        const duration = durationMap.get(v.id.videoId);
        if (!duration) return null;

        try {
          const durationSeconds = toSeconds(parse(duration));
          return {
            id: v.id.videoId,
            title: v.snippet.title,
            publishedAt: v.snippet.publishedAt,
            thumbnails: v.snippet.thumbnails,
            description: v.snippet.description,
            duration: durationSeconds
          };
        } catch (err) {
          console.warn(`⚠️ Skipping video ${v.id.videoId}: Invalid duration format`);
          return null;
        }
      })
      .filter(v => {
        if (!v) return false;
        const t = v.thumbnails?.medium || v.thumbnails?.high;
        if (!t) return false;
        const w = t.width || 16;
        const h = t.height || 9;
        const aspectRatio = w / h;
        return Math.abs(aspectRatio - 16/9) < 0.05 && v.duration > 600;
      });

    // Write to file
    fs.writeFileSync(path.join(feedsDir, "recently.json"), JSON.stringify(items, null, 2));
    console.log(`✅ Recently Added (>10 min, 16:9): ${items.length}`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    fs.writeFileSync(path.join(feedsDir, "recently.json"), JSON.stringify([], null, 2));
  }
}

run();
