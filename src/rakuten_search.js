// ===============================
// 楽天API：型番検索（既存）
// ===============================
async function rakutenSearchAmbiguous(model) {

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

    if (!kw || typeof kw !== "string") continue;

    const url =
      `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701` +
      `?applicationId=a38ecc5b-5a90-4eb9-b4f8-e714ba84eefd` +
      `&accessKey=pk_oRPj9UEOAjvjnUtRwKwaje85mgY98Nzo7rzvGf7sQRj` +
      `&keyword=${encodeURIComponent(kw)}` +
      `&hits=30` +
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

      for (const wrapper of json.Items) {
        const item = wrapper.Item;
        if (!item) continue;

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



// ===============================
// ⭐ 楽天API：ブランド検索（新規追加）
// ===============================
async function rakutenSearchBrand(brand) {

  if (!brand || typeof brand !== "string") {
    console.warn("⚠ rakutenSearchBrand: brand が不正:", brand);
    return [];
  }

  const url =
    `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701` +
    `?applicationId=a38ecc5b-5a90-4eb9-b4f8-e714ba84eefd` +
    `&accessKey=pk_oRPj9UEOAjvjnUtRwKwaje85mgY98Nzo7rzvGf7sQRj` +
    `&keyword=${encodeURIComponent(brand)}` +
    `&hits=30` +
    `&format=json`;

  console.log("🔗 ブランド検索URL:", url);

  let results = [];

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("⚠ 楽天APIエラー:", res.status);
      return results;
    }

    const json = await res.json();
    if (!json.Items) return results;

    for (const wrapper of json.Items) {
      const item = wrapper.Item;
      if (!item) continue;

      results.push({
        shop: item.shopName,
        price: item.itemPrice,
        url: item.itemUrl
      });
    }

  } catch (e) {
    console.error("rakutenSearchBrand error:", e);
  }

  return results;
}


// ===============================
// Export（必須）
// ===============================
export { rakutenSearchAmbiguous, rakutenSearchBrand };
