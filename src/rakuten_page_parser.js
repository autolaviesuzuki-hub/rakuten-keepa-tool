// ===============================
// 型番抽出ロジック（楽天商品ページ）
// ===============================

// 型番の正規表現パターン
const MODEL_PATTERNS = [
  /[A-Z]{2}[0-9]{4}-[0-9]{3}/g,          // 基本型番 DC1460-007
  /[A-Z]{2}[0-9]{7}/g,                   // ハイフンなし DC1460007
  /[A-Z]{2}[0-9]{4}-[0-9]{3}[A-Z]/g,     // カラー違い DC1460-007A
  /[A-Z]{2}[0-9]{4}-[0-9]{3}-[0-9]{2}/g  // サイズ付き DC1460-007-10
];

// HTML を取得
async function fetchHtml(url) {
  const res = await fetch(url);
  if (!res.ok) return "";
  return await res.text();
}

// 正規表現で型番抽出
function extractModelsFromText(text) {
  let results = [];

  for (const pattern of MODEL_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) results.push(...matches);
  }

  return [...new Set(results)]; // 重複除去
}

// 画像URLから型番抽出
function extractModelsFromImages(html) {
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  let results = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[1];
    const found = extractModelsFromText(url);
    results.push(...found);
  }

  return [...new Set(results)];
}

// alt テキストから抽出
function extractModelsFromAlt(html) {
  const altRegex = /alt="([^"]+)"/g;
  let results = [];
  let match;

  while ((match = altRegex.exec(html)) !== null) {
    const alt = match[1];
    const found = extractModelsFromText(alt);
    results.push(...found);
  }

  return [...new Set(results)];
}

// itemCode から抽出（例：nike:DC1460-007）
function extractModelFromItemCode(itemCode) {
  if (!itemCode) return [];
  return extractModelsFromText(itemCode);
}

// ===============================
// メイン：楽天商品ページから型番抽出
// ===============================
async function extractModelFromRakutenPage(item) {

  const html = await fetchHtml(item.url);
  if (!html) return [];

  let candidates = [];

  // 商品説明文
  candidates.push(...extractModelsFromText(html));

  // 画像URL
  candidates.push(...extractModelsFromImages(html));

  // alt テキスト
  candidates.push(...extractModelsFromAlt(html));

  // itemCode
  candidates.push(...extractModelFromItemCode(item.itemCode));

  // 重複除去
  candidates = [...new Set(candidates)];

  return candidates;
}

export { extractModelFromRakutenPage };
