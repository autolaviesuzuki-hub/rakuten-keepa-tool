import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
app.use(express.json());

// 楽天商品ページのHTMLを取得して型番抽出
app.post("/extract-model", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });

  try {
    const html = await fetch(url).then(r => r.text());
    const $ = cheerio.load(html);

    const text = $("body").text();
    const models = text.match(/[A-Z0-9\-]{6,}/g) || [];

    res.json({ models: Array.from(new Set(models)) });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
