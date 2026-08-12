// ===============================
// Keepa lookup（型番 → ASIN照合）
// ===============================

// CSV読み込み
async function loadKeepaCSV() {
  const res = await fetch("../data/keepa.csv");
  const text = await res.text();

  const lines = text.split("\n");
  const header = lines[0].split(",");

  const modelIndex = header.indexOf("model");
  const asinIndex = header.indexOf("asin");

  let map = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const model = cols[modelIndex]?.trim();
    const asin = cols[asinIndex]?.trim();

    if (model && asin) {
      map[model] = asin;
    }
  }

  return map; // { "DC1460-007": "B08XXXXXX", ... }
}

// 型番候補と Keepa の model を照合
function matchModelWithKeepa(modelCandidates, keepaMap) {
  let matched = [];

  for (const candidate of modelCandidates) {
    if (keepaMap[candidate]) {
      matched.push({
        model: candidate,
        asin: keepaMap[candidate]
      });
    }
  }

  return matched;
}

// ===============================
// メイン：Keepa照合
// ===============================
async function keepaLookup(modelCandidates) {
  const keepaMap = await loadKeepaCSV();
  return matchModelWithKeepa(modelCandidates, keepaMap);
}

export { keepaLookup };
