import fs from "fs";
import path from "path";

const feedsDir = path.join("data", "feeds");
const recentFile = path.join(feedsDir, "recently.json");
const mostFile = path.join(feedsDir, "most-viewed.json");
const recommendedFile = path.join(feedsDir, "recommended.json");

fs.mkdirSync(feedsDir, { recursive: true });

if (!fs.existsSync(recentFile)) fs.writeFileSync(recentFile, "[]", "utf-8");
if (!fs.existsSync(mostFile)) fs.writeFileSync(mostFile, "[]", "utf-8");

const recent = JSON.parse(fs.readFileSync(recentFile, "utf-8"));
const most = JSON.parse(fs.readFileSync(mostFile, "utf-8"));

let combined = [...recent, ...most].filter(
  (v, i, a) => a.findIndex(x => x.id === v.id) === i
);

combined = combined.filter(v => {
  const t = v.thumbnails?.maxres || v.thumbnails?.high || v.thumbnails?.medium;
  if (!t || !v.duration) return false;
  const w = t.width || 16;
  const h = t.height || 9;
  const aspectRatio = w / h;
  return Math.abs(aspectRatio - 16 / 9) < 0.05 && v.duration > 600;
});

const shuffled = combined.sort(() => 0.5 - Math.random());
fs.writeFileSync(recommendedFile, JSON.stringify(shuffled.slice(0, 50), null, 2), "utf-8");
console.log(`✅ Recommended (>10 min, 16:9): ${shuffled.length}`);
