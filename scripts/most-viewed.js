import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const KEY = process.env.YT_KEY;
const CHANNEL = process.env.YT_CHANNEL_ID;

if (!KEY || !CHANNEL) {
  console.error("❌ Missing YT_KEY or YT_CHANNEL_ID environment variable.");
  process.exit(1);
}

const feedsDir = path.join("data", "feeds");
const mostFile = path.join(feedsDir, "most-viewed.json");

// Ensure the directory exists
fs.mkdirSync(feedsDir, { recursive: true });

async function run() {
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("channelId", CHANNEL);
    url.searchParams.set("order", "viewCount");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("type", "video");
    url.searchParams.set("key", KEY);

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error("❌ YouTube API Error:", data.error);
      return;
    }

    const items = data.items.map(v => ({
      id: v.id.videoId,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      thumbnails: v.snippet.thumbnails,
      description: v.snippet.description
    }));

    fs.writeFileSync(mostFile, JSON.stringify(items, null, 2), "utf-8");
    console.log(`✅ Most Viewed: ${items.length}`);
  } catch (err) {
    console.error("❌ Failed to fetch most viewed videos:", err);
  }
}

run();
