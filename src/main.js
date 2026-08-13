// ===============================
// 必要なモジュールを読み込み
// ===============================
import { rakutenSearchModel, rakutenSearchBrand } from "./rakuten_search.js";
import { parseRakutenPage } from "./rakuten_page_parser.js";
import { keepaLookup } from "./keepa_lookup.js";

// ===============================
// 結果をブラウザでダウンロードする
// ===============================
function downloadResults(results) {
  const blob = new Blob([JSON.stringify(results, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "results.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ===============================
// 型番検索（ブランド＋カテゴリ＋性別＋型番）
// ===============================
export async function runFullPipeline(entry) {
  console.log("🔍 型番検索:", entry);

  // 楽天検索（型番）
  const items = await rakutenSearchModel(entry);
  console.log("🔍 楽天検索結果:", items);

  let finalResults = [];

  for (const item of items) {
    console.log("📄 商品ページ解析:", item.url);

    const modelCandidates = await parseRakutenPage(item.url);
    console.log("🔍 抽出された型番候補:", modelCandidates);

    const matches = await keepaLookup(modelCandidates);
    console.log("🔍 Keepa一致:", matches);

    finalResults.push({
      item,
      modelCandidates,
      keepaMatches: matches
    });
  }

  console.log("🎉 型番検索最終結果:", finalResults);

  // 🔥 検索結果をダウンロード
  downloadResults(finalResults);
}

// ===============================
// ブランド検索（ブランド名のみ）
// ===============================
export async function runBrandPipeline(brand) {
  console.log("🔍 ブランド検索:", brand);

  const items = await rakutenSearchBrand(brand);
  console.log("🔍 ブランド検索結果:", items);

  let finalResults = [];

  for (const item of items) {
    console.log("📄 商品ページ解析:", item.url);

    const modelCandidates = await parseRakutenPage(item.url);
    console.log("🔍 抽出された型番候補:", modelCandidates);

    const matches = await keepaLookup(modelCandidates);
    console.log("🔍 Keepa一致:", matches);

    finalResults.push({
      item,
      modelCandidates,
      keepaMatches: matches
    });
  }

  console.log("🎉 ブランド検索最終結果:", finalResults);

  // 🔥 検索結果をダウンロード
  downloadResults(finalResults);
}
