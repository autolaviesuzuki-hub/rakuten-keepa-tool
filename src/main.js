import { rakutenSearchAmbiguous } from "./rakuten_search.js";
import { keepaLookup, loadKeepaCsv } from "./keepa_lookup.js";

// ===============================
// Render API：楽天商品ページ → 型番抽出
// ===============================
async function extractModelFromRakutenPage(url) {
  const api = "https://rakuten-keepa-tool.onrender.com/extract-model";

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
// 型番正規化（揺れ吸収）
// ===============================
function normalizeModel(model) {
  const m = model.toUpperCase();

  // DC1460-007 / FJ5929-003 / FB2207-001 / IO9565-400 / HQ1996-001 / FN7304-100
  const match = m.match(/(DC|FJ|FB|IO|HQ|FN)\d{4}-\d{3}/);
  if (match) return match[0];

  // DC1460007 → DC1460-007
  const compact = m.match(/(DC|FJ|FB|IO|HQ|FN)\d{7}/);
  if (compact) {
    const base = compact[0];
    return base.slice(0,6) + "-" + base.slice(6);
  }

  return null;
}

// ===============================
// 単一型番：曖昧検索 → 型番抽出 → Keepa照合
// ===============================
async function runFullPipeline(modelEntry) {

  console.log("🔍 入力モデル:", modelEntry);

  // ① 曖昧検索
  const candidates = await rakutenSearchAmbiguous(modelEntry);
  console.log("🔍 曖昧検索候補:", candidates);

  let finalResults = [];

  for (const item of candidates) {

    console.log("📄 商品ページ解析:", item.url);

    // ② Render API で型番抽出
    const modelCandidates = await extractModelFromRakutenPage(item.url);
    console.log("🔍 抽出された型番候補:", modelCandidates);

    if (modelCandidates.length === 0) {
      console.log("⚠ 型番抽出できず → スキップ");
      continue;
    }

    // ③ Keepa照合
    const matched = await keepaLookup(modelCandidates);
    console.log("🔍 Keepa一致:", matched);

    if (matched.length === 0) {
      console.log("⚠ Keepa一致なし → スキップ");
      continue;
    }

    // 最初の一致を採用
    const best = matched[0];

    finalResults.push({
      asin: best.asin,
      model: best.model,
      shop: item.shop,
      price: item.price,
      url: item.url,
      matchedModel: best.model
    });
  }

  console.log("🎉 最終結果:", finalResults);

  // results.json をダウンロード保存
  const blob = new Blob([JSON.stringify(finalResults, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "results.json";
  a.click();

  return finalResults;
}

// ===============================
// 複数型番検索：Keepa.csv 全行 → 全型番検索
// ===============================
async function runFullPipelineAllModels() {

  console.log("📦 Keepa.csv 全型番検索モード開始");

  const keepaRows = await loadKeepaCsv();
  let allResults = [];

  for (const row of keepaRows) {

    const rawModel = (row.model || row.partNumber || "").trim();
    if (!rawModel) continue;

    const normalized = normalizeModel(rawModel);
    if (!normalized) continue;

    console.log("🔍 型番検索:", normalized);

    const results = await runFullPipeline(normalized);

    allResults.push({
      asin: row.asin,
      model: normalized,
      brand: row.brand,
      results: results
    });
  }

  console.log("🎉 全型番検索完了:", allResults);

  // results_all.json を保存
  const blob = new Blob([JSON.stringify(allResults, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "results_all.json";
  a.click();

  return allResults;
}

export { runFullPipeline, runFullPipelineAllModels };
