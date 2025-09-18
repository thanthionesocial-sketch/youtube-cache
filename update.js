import fs from "fs";
import fetch from "node-fetch";

const API_KEY = process.env.YT_KEY;
const PLAYLIST_IDS = [
  "PLkdhKIzS8nUlPEjE-p4fzZVt-pX96uffL",
  "PLkdhKIzS8nUnX3_wgi81phau_5PBtnuC1",
  "PLkdhKIzS8nUnT6EIfYIOJqjIC3ifBORKU",
  "PLkdhKIzS8nUnq-OykjNFBNGWYbB1Pa6eX",
  "PLkdhKIzS8nUlgYeQhV3UY4ibQ0nAGuK1y",
  "PLkdhKIzS8nUl9n2wqOJ6zzK2E_Q8qssdm",
  "PLkdhKIzS8nUntEI1ZueSQFdnPt-tGhiWT",
  "PLkdhKIzS8nUlMJvw4KJVvgtJioC57omvW",
  "PLkdhKIzS8nUnmWnY660x7zh9AH6sIB16J",
  "PLkdhKIzS8nUnRFvWYOof1qqEumGH3HTIX",
  "PLkdhKIzS8nUmqiZSk3LcTGelwDfHeiq15",
  "PLkdhKIzS8nUkJs2k7Woxdk4BWl0pdKhyf",
  "PLkdhKIzS8nUkB8STcvvnkJ0JPIXXSEhZw",
  "PLkdhKIzS8nUmPv6Pv2bF-r8_-YljKX8s8",
  "PLkdhKIzS8nUlA55Bfwj9dbSgPhY60CT9K",
  "PLkdhKIzS8nUnLUTCqe2gY4UgpEskSXJJd",
  "PLkdhKIzS8nUnVTxf3BUrU_DQiGXTh3I0T",
  "PLkdhKIzS8nUkj0HfIE5JZu911RK0DmU3V",
  "PLkdhKIzS8nUn56ebMPrAiQNzhfEQAhLDk",
  "PLkdhKIzS8nUm8ofyxuLagWIrx4hCUVaKg",
  "PLkdhKIzS8nUlpARmUPTlQz-3BShoax9WV",
  "PLkdhKIzS8nUknzX9JXNZGnNge6fZ--jiy",
  "PLkdhKIzS8nUkiQuxNXiORoaTg5p1BBjbr",
  "PLkdhKIzS8nUm7XAvYNcvKhsK0HIIBCtho",
  "PLkdhKIzS8nUm1zt3nTqNGadSlxuHda6Vp",
  "PLkdhKIzS8nUlNgqwC90JMKKH07ygsAikd",
  "PLkdhKIzS8nUnNobktoctZLgyNKWa0-feT",
  "PLkdhKIzS8nUmubf0uVOYR0LsTsdOAsZN0",
  "PLkdhKIzS8nUnpzkgeGJlLLi-7Xwdfj5dE",
  "PLkdhKIzS8nUkZ9WfAPiBzBEQh7Q43_bd1",
  "PLkdhKIzS8nUmJHJsagYRDewAFQITz3Q2U",
  "PLkdhKIzS8nUneyJCjtwqMa1w6svulBSFc",
  "PLkdhKIzS8nUk-Ue0gwpRxL6IE1E_4fsP3",
  "PLkdhKIzS8nUkwK7UuNEMNVbyVQj4eWd-T",
  "PLkdhKIzS8nUkHry-qqPqRXcz1UJbsVQ6F",
  "PLkdhKIzS8nUkHJEK9tlrf4oMbFMCqDbAp",
  "PLkdhKIzS8nUlMfh7Pe_4YM3o-9JpsBhN_",
  "PLkdhKIzS8nUnGpZ4-gGLum_etE3o7-NAs",
  "PLkdhKIzS8nUlTAVTKkFrurUmv8rYUqSHe",
  "PLkdhKIzS8nUleBlrj9BtMY-_nbWGO2WdR"
];

if (!API_KEY) {
  console.error("Missing YT_KEY");
  process.exit(1);
}

(async () => {
  const allPlaylists = {};
  for (const PLAYLIST_ID of PLAYLIST_IDS) {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=${PLAYLIST_ID}&key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} – ${text}`);
    }
    const data = await res.json();
    allPlaylists[PLAYLIST_ID] = data;
  }
  fs.writeFileSync("playlist.json", JSON.stringify(allPlaylists, null, 2));
  console.log("✅ playlist.json updated");
})();
