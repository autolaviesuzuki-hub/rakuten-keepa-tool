// 楽天商品ページの HTML を Render API 経由で取得し、型番を抽出する
export async function extractModelFromRakutenPage(item) {
  const url = item.url;

  // Render API（あなた専用のクラウド型 型番抽出API）
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


// 型番抽出 → Keepa照合まで一気に処理する関数
export async function parseRakutenItem(item, keepaData) {
  // 型番抽出（Render API）
  const models = await extractModelFromRakutenPage(item);

  // Keepa照合
  const matched = matchKeepa(models, keepaData);

  return {
    url: item.url,
    shop: item.shop,
    price: item.price,
    models,
    keepa: matched
  };
}


// Keepa の型番照合ロジック（あなたの既存ロジックを踏襲）
export function matchKeepa(models, keepaData) {
  if (!models || models.length === 0) return null;

  for (const model of models) {
    const hit = keepaData.find(k => {
      return (
        k.model &&
        k.model.toUpperCase().includes(model.toUpperCase())
      );
    });

    if (hit) return hit;
  }

  return null;
}
