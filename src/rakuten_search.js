// ===============================
// 楽天API：型番だけで検索（最適化版）
// ===============================
async function rakutenSearchAmbiguous(model) {

  // 型番だけで検索する（メンズ・ブランドワード完全排除）
  const keywords = [
    model,                 // DC1460-007
    model.replace("-", ""),// DC1460007
  ];

  let results = [];

  for (const kw of keywords) {

    const url =
      `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701` +
      `?applicationId=a38ecc5b-5a90-4eb9-b4f8-e714ba84eefd` +
      `&accessKey=pk_oRPj9UEOAjvjnUtRwKwaje85mgY98Nzo7rzvGf7sQRj` +
      `&keyword=${encodeURIComponent(kw)}` +
      `&hits=10` +                // ★ 30 → 10 に最適化
      `&format=json`;

    console.log("🔗 楽天API URL:", url);

    try {
      const res = await fetch(url);

      if (!res.ok) {
        console.warn("⚠ 楽天APIエラー:", res.status);
        continue;
      }

      const json = await res.json();
      if (!json.Items) continue;

      for (const item of json.Items) {
        results.push({
          shop: item.shopName,
          price: item.itemPrice,
          url: item.itemUrl
        });
      }

    } catch (e) {
      console.error("rakutenSearchAmbiguous error:", e);
    }
  }

  return results;
}

export { rakutenSearchAmbiguous };
