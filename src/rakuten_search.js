// Rakuten API Keys
const APPLICATION_ID = "a38ecc5b-5a90-4eb9-b4f8-e714ba84eefd";   // あなたの applicationId
const ACCESS_KEY = "pk_oRPj9UEOAjvjnUtRwKwaje85mgY98Nzo7rzvGf7sQRj";    // あなたの accessKey

// キュー方式（429対策）
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 曖昧検索キーワード生成
function buildKeywords(modelEntry) {
  const brand = modelEntry.brand || "ナイキ";
  const category = modelEntry.category || "スニーカー";
  const gender = modelEntry.gender || "メンズ";

  return [
    `${brand} ${category} ${gender}`,
    `${brand} ${category}`,
    `${brand} ${gender}`,
    `${brand}`,
  ];
}

// 楽天API URL生成
function buildUrl(keyword) {
  return (
    "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701"
    + `?applicationId=${applicationId}`
    + `&accessKey=${accessKey}`
    + `&keyword=${encodeURIComponent(keyword)}`
    + "&hits=30"
    + "&format=json"
  );
}

// 曖昧検索（キュー方式）
async function rakutenSearchAmbiguous(modelEntry) {

  const keywords = buildKeywords(modelEntry);
  let results = [];

  for (const kw of keywords) {

    // 429対策：1秒に1回
    await sleep(1000);

    const res = await fetch(buildUrl(kw));
    if (!res.ok) continue;

    const json = await res.json();
    if (!json.Items) continue;

    json.Items.forEach(it => {
      const item = it.Item;

      results.push({
        shop: item.shopName,
        title: item.itemName,
        url: item.itemUrl,
        price: item.itemPrice,
        itemCode: item.itemCode
      });
    });
  }

  return results;
}

export { rakutenSearchAmbiguous };
