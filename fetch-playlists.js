import fs from "fs";
import fetch from "node-fetch";

const API_KEY = process.env.YT_API_KEY;

// read all playlist descriptor JSON files
const files = fs.readdirSync("playlists").filter(f => f.endsWith(".json"));

for (const file of files) {
  const info = JSON.parse(fs.readFileSync(`playlists/${file}`, "utf-8"));
  if (!info.playlistId) {
    console.warn(`⚠️  No playlistId for ${file}`);
    continue;
  }
  const url =
    `https://www.googleapis.com/youtube/v3/playlistItems` +
    `?part=snippet&maxResults=50&playlistId=${info.playlistId}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  // save under data/ with the same name, e.g. data/aathmaan-videos.json
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(`data/${file.replace(".json", "-videos.json")}`,
                   JSON.stringify(data, null, 2));
  console.log(`✅ Updated ${file}`);
}
