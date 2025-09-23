import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { parse, toSeconds } from "iso8601-duration"; // Add this dependency

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
    // Step 1: Get uploads playlist ID
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL}&key=${KEY}`
    );
    const channelData = await channelRes.json();
    if (!channelData.items?.length) {
      console.error("❌ Could not fetch channel details");
      fs.writeFileSync(mostFile, JSON.stringify([], null, 2), "utf-8");
      return;
    }
    const uploadsPlaylist = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Step 2: Fetch all videos in uploads playlist
    let items = [];
    let pageToken = "";
    do {
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.set("part", "snippet,contentDetails");
      url.searchParams.set("playlistId", uploadsPlaylist);
      url.searchParams.set("maxResults", "50");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      url.searchParams.set("key", KEY);

      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        console.error("❌ YouTube API Error:", data.error);
        fs.writeFileSync(mostFile, JSON.stringify([], null, 2), "utf-8");
        break;
      }

      items = items.concat(data.items || []);
      pageToken = data.nextPageToken || "";
    } while (pageToken);

    // Step 3: Fetch video stats (views) and durations in batches
    const allVideos = [];
    for (let i = 0; i < items.length; i += 50) {
      const batch = items.slice(i, i + 50);
      const ids = batch.map(v => v.contentDetails.videoId).join(",");

      const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      statsUrl.searchParams.set("part", "snippet,statistics,contentDetails"); // Added contentDetails
      statsUrl.searchParams.set("id", ids);
      statsUrl.searchParams.set("key", KEY);

      const statsRes = await fetch(statsUrl);
      const statsData = await statsRes.json();

      statsData.items.forEach(v => {
        const t = v.snippet.thumbnails?.maxres || v.snippet.thumbnails?.high || v.snippet.thumbnails?.medium;
        if (!t || !v.contentDetails?.duration) return;

        // Parse duration
        try {
          const durationSeconds = toSeconds(parse(v.contentDetails.duration));
          if (durationSeconds <= 600) return; // Filter for > 10 minutes (600 seconds)

          // Filter only ~16:9 videos
          const w = t.width || 16, h = t.height || 9;
          if (Math.abs(w / h - 16 / 9) > 0.05) return;

          allVideos.push({
            id: v.id,
            title: v.snippet.title,
            description: v.snippet.description,
            publishedAt: v.snippet.publishedAt,
            thumbnails: v.snippet.thumbnails,
            views: parseInt(v.statistics?.viewCount || "0", 10),
            duration: durationSeconds // Optional: include duration in output
          });
        } catch (err) {
          console.warn(`⚠️ Skipping video ${v.id}: Invalid duration format`);
        }
      });
    }

    // Step 4: Sort by views (descending)
    allVideos.sort((a, b) => b.views - a.views);

    // Step 5: Save top 50
    fs.writeFileSync(mostFile, JSON.stringify(allVideos.slice(0, 50), null, 2), "utf-8");
    console.log(`✅ Most Viewed (>10 min, 16:9): ${allVideos.length} videos fetched, saved top 50.`);
  } catch (err) {
    console.error("❌ Failed to fetch most viewed videos:", err);
    fs.writeFileSync(mostFile, JSON.stringify([], null, 2), "utf-8");
  }
}

run();
