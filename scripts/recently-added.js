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
const recentlyFile = path.join(feedsDir, "recently.json");

// Ensure the directory exists
fs.mkdirSync(feedsDir, { recursive: true });

async function run() {
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("channelId", CHANNEL);
    url.searchParams.set("order", "date");
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

    fs.writeFileSync(recentlyFile, JSON.stringify(items, null, 2), "utf-8");
    console.log(`✅ Recently Added: ${items.length}`);
  } catch (err) {
    console.error("❌ Failed to fetch recently added videos:", err);
  }
}

run();
