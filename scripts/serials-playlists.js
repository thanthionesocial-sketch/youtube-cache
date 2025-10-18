import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Use environment variable from GitHub Actions
const API_KEY = process.env.YT_KEY;
if (!API_KEY) {
  console.error("❌ Missing YT_KEY environment variable");
  process.exit(1);
}

// Fetch all playlist items (max 50 per page)
async function getAllItems(playlistId) {
  const allItems = [];
  let pageToken;

  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("key", API_KEY);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();

    if (Array.isArray(data.items) && data.items.length) {
      allItems.push(...data.items);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allItems;
}

// Fetch video durations for all video IDs
async function getVideoDurations(videoIds) {
  const durations = {};
  const chunks = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("id", chunk.join(","));
    url.searchParams.set("key", API_KEY);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();

    data.items.forEach((v) => {
      durations[v.id] = v.contentDetails.duration; // ISO 8601 format
    });
  }

  return durations;
}

async function run() {
  const playlistsDir = path.join("playlists", "serials");
  const outputDir = path.join("data", "serials");

  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs
    .readdirSync(playlistsDir)
    .filter((f) => f.toLowerCase().endsWith(".json"));

  for (const file of files) {
    const fullPath = path.join(playlistsDir, file);
    const info = JSON.parse(fs.readFileSync(fullPath, "utf8"));

    if (!info.playlistId) {
      console.warn(`⚠️ No playlistId for ${file}`);
      continue;
    }

    try {
      const items = await getAllItems(info.playlistId);
      const videoIds = items.map((v) => v.snippet.resourceId.videoId);
      const videoDurations = await getVideoDurations(videoIds);

      // Flatten JSON into OTT-ready format
      const flatJson = {
        showId: info.playlistId,
        showTitle: info.title || "Untitled Show",
        showDescription: info.description || "",
        episodes: items.map((v) => ({
          id: v.snippet.resourceId.videoId,
          title: v.snippet.title,
          description: v.snippet.description,
          thumbnail: v.snippet.thumbnails.maxres
            ? v.snippet.thumbnails.maxres.url
            : v.snippet.thumbnails.high.url,
          publishedAt: v.snippet.publishedAt,
          playlistId: v.snippet.playlistId,
          position: v.snippet.position,
          channelTitle: v.snippet.channelTitle,
          videoOwnerChannelTitle: v.snippet.videoOwnerChannelTitle,
          videoOwnerChannelId: v.snippet.videoOwnerChannelId,
          duration: videoDurations[v.snippet.resourceId.videoId] || null,
        })),
      };

      const outFile = path.join(
        outputDir,
        file.replace(/\.json$/i, "-videos.json")
      );
      fs.writeFileSync(outFile, JSON.stringify(flatJson, null, 2));
      console.log(`✅ ${file}: ${flatJson.episodes.length} episodes`);
    } catch (err) {
      console.error(`❌ ${file}: ${err.message}`);
    }
  }
}

run().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
