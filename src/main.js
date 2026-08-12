import { rakutenSearchAmbiguous } from "./rakuten_search.js";
import { extractModelFromRakutenPage } from "./rakuten_page_parser.js";
import { keepaLookup } from "./keepa_lookup.js";

// ===============================
// 全体統合：曖昧検索 → 型番抽出 → Keepa照合
// ===============================
async function runFullPipeline(modelEntry) {

  // ① 曖昧検索（Xebio など型番なしショップを拾う）
  const candidates = await rakutenSearchAmbiguous(modelEntry);

  let finalResults = [];

  for (const item of candidates) {

    // ② 商品ページから型番抽出
    const modelCandidates = await extractModelFromRakutenPage(item);

    // 型番が1つも抽出できなければスキップ
    if (modelCandidates.length === 0) continue;

    // ③ Keepa照合（正しい商品だけ残す）
    const matched = await keepaLookup(modelCandidates);

    if (matched.length > 0) {
      finalResults.push({
        item,
        matched
      });
    }
  }

  return finalResults;
}

export { runFullPipeline };
