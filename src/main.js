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
// 単一型番検索パイプライン
// ===============================
async function runFullPipeline(modelEntry) {

  console.log("🔍 入力モデル:", modelEntry);

  // modelEntry がオブジェクトでも文字列でも安全に処理
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

  // ① 型番だけで楽天検索（最適化済み rakuten_search.js）
  const candidates = await rakutenSearchAmbiguous(targetModel);
  console.log("🔍 曖昧検索候補:", candidates);

  let finalResults = [];

  for (const item of candidates) {

    console.log("📄 商品ページ解析:", item.url);

    // ② 型番抽出
    let modelCandidates = await extractModelFromRakutenPage(item.url);
    console.log("🔍 抽出された型番候補:", modelCandidates);

    // ③ フィルタリング（偏り解消）
    modelCandidates = filterCandidates(modelCandidates, targetModel);
    console.log("🔍 フィルタ後の型番候補:", modelCandidates);

    if (modelCandidates.length === 0) {
      console.log("⚠ フィルタ後に型番候補なし → スキップ");
      continue;
    }

    // ④ Keepa照合
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
      url: item.url,
      matchedModel: best.model
    });
  }

  console.log("🎉 最終結果:", finalResults);

  // results.json 保存
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
// 複数型番検索
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
