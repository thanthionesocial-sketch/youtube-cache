import fs from "fs";

// read master array
const playlists = JSON.parse(
  fs.readFileSync("playlists-master.json", "utf8")
);

// output folder
const outDir = "playlists";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

playlists.forEach(p => {
  // make a safe filename like garudaa.json
  const fileName = p.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") + ".json";

  const json = JSON.stringify(p, null, 2);
  fs.writeFileSync(`${outDir}/${fileName}`, json);
  console.log(`✅ ${fileName}`);
});

console.log("All playlist files created in /playlists");
