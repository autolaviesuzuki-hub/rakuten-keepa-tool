import { rakutenSearchAmbiguous } from "./rakuten_search.js";
import { extractModelFromRakutenPage } from "./rakuten_page_parser.js";
import { keepaLookup } from "./keepa_lookup.js";

// ===============================
// 全体統合：曖昧検索 → 型番抽出 → Keepa照合
// ===============================
async function runFullPipeline(modelEntry) {

  const candidates = await rakutenSearchAmbiguous(modelEntry);
  let finalResults = [];

  for (const item of candidates) {

    const modelCandidates = await extractModelFromRakutenPage(item);
    if (modelCandidates.length === 0) continue;

    const matched = await keepaLookup(modelCandidates);
    if (matched.length === 0) continue;

    // Keepa一致モデルは複数ある可能性があるが、最初の1つを採用
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

  // ===============================
  // results.json を output フォルダに保存
  // ===============================
  const blob = new Blob([JSON.stringify(finalResults, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "results.json";
  a.click();

  return finalResults;
}
console.log("抽出された型番:", modelCandidates);

export { runFullPipeline };
