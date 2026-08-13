async function rakutenSearchAmbiguous(model) {

  // model が undefined の場合は即終了
  if (!model || typeof model !== "string") {
    console.warn("⚠ rakutenSearchAmbiguous: model が不正:", model);
    return [];
  }

  const keywords = [
    model,
    model.replace("-", "")
  ];

  let results = [];

  for (const kw of keywords) {

    // kw が undefined の場合はスキップ
    if (!kw || typeof kw !== "string") continue;

    const url =
      `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701` +
      `?applicationId=a38ecc5b-5a90-4eb9-b4f8-e714ba84eefd` +
      `&accessKey=pk_oRPj9UEOAjvjnUtRwKwaje85mgY98Nzo7rzvGf7sQRj` +
      `&keyword=${encodeURIComponent(kw)}` +
      `&hits=10` +
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
