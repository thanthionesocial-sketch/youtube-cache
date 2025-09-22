import fs from "fs";
import path from "path";

const feedsDir = path.join("data", "feeds");
const recentFile = path.join(feedsDir, "recently.json");
const mostFile = path.join(feedsDir, "most-viewed.json");
const recommendedFile = path.join(feedsDir, "recommended.json");

// Ensure the feeds directory exists
fs.mkdirSync(feedsDir, { recursive: true });

// Create empty JSON files if they don't exist
if (!fs.existsSync(recentFile)) fs.writeFileSync(recentFile, "[]", "utf-8");
if (!fs.existsSync(mostFile)) fs.writeFileSync(mostFile, "[]", "utf-8");

// Read JSON files safely
const recent = JSON.parse(fs.readFileSync(recentFile, "utf-8"));
const most   = JSON.parse(fs.readFileSync(mostFile, "utf-8"));

// Merge, deduplicate, and shuffle
const combined = [...recent, ...most].filter(
  (v, i, a) => a.findIndex(x => x.id === v.id) === i
);
const shuffled = combined.sort(() => 0.5 - Math.random());

// Write top 50 recommended items
fs.writeFileSync(recommendedFile, JSON.stringify(shuffled.slice(0, 50), null, 2), "utf-8");
console.log(`✅ Recommended: ${shuffled.length}`);
