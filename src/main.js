import { rakutenSearchAmbiguous, rakutenSearchBrand } from "./rakuten_search.js";
import { keepaLookup, loadKeepaCsv } from "./keepa_lookup.js";

// ===============================
// Render API：楽天商品ページ → 型番抽出
// ===============================
async function extractModelFromRakutenPage(url) {
  const api = "https://rakuten-keepa-tool.onrender.com/extract-model";

  if (!url || typeof url !== "string") {
    console.error("❌ extractModelFromRakutenPage: URL が不正:", url);
    return [];
  }

  try {
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!res.ok) {
      console.error("Render API error:", res.status);
      return [];
    }

    const json = await res.json();
    return json.models || [];

  } catch (e) {
    console.error("extractModelFromRakutenPage error:", e);
    return [];
  }
}

// ===============================
// 型番抽出フィルタリング
// ===============================
function filterCandidates(modelCandidates, targetModel) {
  if (!targetModel || typeof targetModel !== "string") return [];

  const t = targetModel.replace("-", "").toUpperCase();

  return modelCandidates.filter(m => {
    const mm = m.replace("-", "").toUpperCase();
    return mm.includes(t);
  });
}

// ===============================
// 型番検索モード（既存）
// ===============================
async function runFullPipeline(modelEntry) {

  console.log("🔍 入力モデル:", modelEntry);

  const targetModel =
    modelEntry && typeof modelEntry === "object" && typeof modelEntry.model === "string"
      ? modelEntry.model
      : typeof modelEntry === "string"
        ? modelEntry
        : null;

  if (!targetModel) {
    console.error("❌ targetModel が undefined → 検索中止");
    return [];
  }

  const candidates = await rakutenSearchAmbiguous(targetModel);
  console.log("🔍 曖昧検索候補:", candidates);

  let finalResults = [];

  for (const item of candidates) {

    const pageUrl = item.url;

    console.log("📄 商品ページ解析:", pageUrl);

    if (!pageUrl) {
      console.error("❌ 商品ページ URL が undefined → スキップ");
      continue;
    }

    let modelCandidates = await extractModelFromRakutenPage(pageUrl);
    console.log("🔍 抽出された型番候補:", modelCandidates);

    modelCandidates = filterCandidates(modelCandidates, targetModel);
    console.log("🔍 フィルタ後の型番候補:", modelCandidates);

    if (modelCandidates.length === 0) {
      console.log("⚠ フィルタ後に型番候補なし → スキップ");
      continue;
    }

    const matched = await keepaLookup(modelCandidates);
    console.log("🔍 Keepa一致:", matched);

    if (matched.length === 0) {
      console.log("⚠ Keepa一致なし → スキップ");
      continue;
    }

    const best = matched[0];

    finalResults.push({
      asin: best.asin,
      model: best.model,
      shop: item.shop,
      price: item.price,
      url: pageUrl,
      matchedModel: best.model
    });
  }

  console.log("🎉 最終結果:", finalResults);
  return finalResults;
}

// ===============================
// ⭐ ブランド検索モード（新規追加）
// ===============================
async function runBrandPipeline(brandName) {

  console.log("🔍 ブランド検索:", brandName);

  // ① ブランド名で楽天検索
  const items = await rakutenSearchBrand(brandName);
  console.log("🔍 ブランド検索結果:", items);

  let finalResults = [];

  for (const item of items) {

    const pageUrl = item.url;
    console.log("📄 商品ページ解析:", pageUrl);

    if (!pageUrl) {
      console.error("❌ 商品ページ URL が undefined → スキップ");
      continue;
    }

    // ② 商品ページから型番抽出
    const modelCandidates = await extractModelFromRakutenPage(pageUrl);
    console.log("🔍 抽出された型番候補:", modelCandidates);

    if (modelCandidates.length === 0) continue;

    // ③ Keepa照合
    const matched = await keepaLookup(modelCandidates);
    console.log("🔍 Keepa一致:", matched);

    if (matched.length === 0) continue;

    const best = matched[0];

    finalResults.push({
      asin: best.asin,
      model: best.model,
      shop: item.shop,
      price: item.price,
      url: pageUrl
    });
  }

  console.log("🎉 ブランド検索最終結果:", finalResults);
  return finalResults;
}

export { runFullPipeline, runBrandPipeline };
