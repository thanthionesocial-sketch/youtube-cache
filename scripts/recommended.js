import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const feedsDir = path.join("data", "feeds");
const recommendedFile = path.join(feedsDir, "recommended.json");

// Ensure feeds directory exists
fs.mkdirSync(feedsDir, { recursive: true });

// Environment variables
const API_KEY = process.env.YT_KEY;
const CHANNEL_ID = process.env.YT_CHANNEL_ID;
if (!API_KEY || !CHANNEL_ID) {
  console.error("❌ Missing YT_KEY or YT_CHANNEL_ID environment variable");
  process.exit(1);
}

// Fetch videos from YouTube channel
async function fetchChannelVideos() {
  let videos = [];
  let pageToken = "";
  while (videos.length < 100) { // fetch up to 100, then filter to 50
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=50&pageToken=${pageToken}&type=video`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) break;

    const ids = data.items.map(v => v.id.videoId).join(",");
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${ids}&part=contentDetails,snippet,statistics`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    videos.push(...detailsData.items);
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return videos;
}

// Filter 16:9 long videos (>10 min) and shuffle
function filterAndShuffle(videos) {
  const filtered = videos.filter(v => {
    const t = v.snippet.thumbnails.maxres || v.snippet.thumbnails.high || v.snippet.thumbnails.medium;
    if (!t || !v.contentDetails?.duration) return false;
    const w = t.width || 16;
    const h = t.height || 9;
    const aspectRatio = w / h;

    // Convert ISO 8601 duration to seconds
    const match = v.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const seconds = (parseInt(match[1] || 0) * 3600) +
                    (parseInt(match[2] || 0) * 60) +
                    (parseInt(match[3] || 0));
    return Math.abs(aspectRatio - 16 / 9) < 0.05 && seconds > 600;
  });

  return filtered.sort(() => 0.5 - Math.random()).slice(0, 50);
}

// Save recommended feed
async function generateRecommended() {
  try {
    const videos = await fetchChannelVideos();
    const finalVideos = filterAndShuffle(videos);
    fs.writeFileSync(recommendedFile, JSON.stringify(finalVideos, null, 2), "utf-8");
    console.log(`✅ Recommended feed generated: ${finalVideos.length} videos`);
  } catch (err) {
    console.error("❌ Failed to generate recommended feed:", err);
  }
}

generateRecommended();
