import fs from "fs";

const recent = JSON.parse(fs.readFileSync("data/recently.json"));
const most   = JSON.parse(fs.readFileSync("data/most-viewed.json"));

// simple algorithm: merge & shuffle
const combined = [...recent, ...most]
  .filter((v,i,a) => a.findIndex(x => x.id === v.id) === i); // deduplicate

const shuffled = combined.sort(() => 0.5 - Math.random());

fs.writeFileSync("data/recommended.json", JSON.stringify(shuffled.slice(0,50), null, 2));
console.log(`✅ Recommended: ${shuffled.length}`);
