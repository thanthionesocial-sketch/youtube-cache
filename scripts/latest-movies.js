import fs from "fs";

// Read all movies-*.json previously generated
const files = fs.readdirSync("data")
  .filter(f => f.startsWith("movies-") && f.endsWith(".json"));

let all = [];
files.forEach(f => {
  const data = JSON.parse(fs.readFileSync(`data/${f}`));
  data.playlists?.forEach(pl =>
    pl.items?.forEach(i => {
      const s = i.snippet;
      all.push({
        id: s.resourceId.videoId,
        title: s.title,
        publishedAt: s.publishedAt,
        thumbnails: s.thumbnails
      });
    })
  );
});

all.sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));

fs.writeFileSync("data/feeds/latest-movies.json", JSON.stringify(all.slice(0,50), null, 2));
console.log(`✅ Latest Movies: ${all.length}`);
