const APPLICATION_ID = "a38ecc5b-5a90-4eb9-b4f8-e714ba84eefd";
const ACCESS_KEY = "pk_oRPj9UEOAjvjnUtRwKwaje85mgY98Nzo7rzvGf7sQRj";

function buildUrl(keyword) {
  const encoded = encodeURIComponent(keyword);
  return `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701?applicationId=${APPLICATION_ID}&accessKey=${ACCESS_KEY}&keyword=${encoded}&hits=30&format=json`;
}

export async function rakutenSearchAmbiguous(modelEntry) {
  const keywords = [
    modelEntry.model,
    `${modelEntry.brand} ${modelEntry.category} ${modelEntry.gender}`,
    `${modelEntry.brand} ${modelEntry.category}`,
    modelEntry.brand
  ];

  let results = [];

  for (const kw of keywords) {
    const url = buildUrl(kw);
    console.log("🔗 楽天API URL:", url);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn("⚠ 楽天APIエラー:", res.status);
        continue;
      }

      const json = await res.json();
      if (json.Items) {
        results.push(...json.Items.map(item => ({
          shop: item.shopName,
          price: item.itemPrice,
          url: item.itemUrl
        })));
      }

    } catch (e) {
      console.error("⚠ fetch失敗:", e);
    }
  }

  return results;
}
