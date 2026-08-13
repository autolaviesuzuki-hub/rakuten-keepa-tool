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
// 型番抽出フィルタリング（偏り解消の核心）
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
// 単一型番：曖昧検索 → 型番抽出 → Keepa照合
// ===============================
async function runFullPipeline(modelEntry) {

  console.log("🔍 入力モデル:", modelEntry);

  // modelEntry がオブジェクトの場合に備える
  const targetModel = typeof modelEntry === "string"
    ? modelEntry
    : modelEntry.model;

  if (!targetModel) {
    console.error("❌ targetModel が空です");
    return [];
  }

  // ① 曖昧検索（型番のみ検索 → メンズ・ナイキなど完全排除）
  const candidates = await rakutenSearchAmbiguous(targetModel);
  console.log("🔍 曖昧検索候補:", candidates);

  let finalResults = [];

  for (const item of candidates) {

    console.log("📄 商品ページ解析:", item.url);

    // ② Render API で型番抽出
    let modelCandidates = await extractModelFromRakutenPage(item.url);
    console.log("🔍 抽出された型番候補:", modelCandidates);

    // ★ フィルタリング追加（偏り解消）
    modelCandidates = filterCandidates(modelCandidates, targetModel);
    console.log("🔍 フィルタ後の型番候補:", modelCandidates);

    if (modelCandidates.length === 0) {
      console.log("⚠ フィルタ後に型番候補なし → スキップ");
      continue;
    }

    // ③ Keepa照合（フィルタ後の候補だけ）
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

    console.log("🔍 型番検索:", rawModel);

    const results = await runFullPipeline(rawModel);

    allResults.push({
      asin: row.asin,
      model: rawModel,
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
