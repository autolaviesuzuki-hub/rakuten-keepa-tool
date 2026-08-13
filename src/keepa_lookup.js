// ===============================
// keepa.csv を読み込む
// ===============================
async function loadKeepaCsv() {
  const url = "https://autolaviesuzuki-hub.github.io/rakuten-keepa-tool/data/keepa.csv";

  const res = await fetch(url);
  const text = await res.text();

  const lines = text.split("\n").map(l => l.trim()).filter(l => l);

  const header = lines[0].split(",");
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const row = {};

    header.forEach((h, idx) => {
      row[h] = cols[idx] || "";
    });

    rows.push(row);
  }

  return rows;
}

// ===============================
// 型番正規化
// ===============================
function normalizeModel(model) {
  const m = model.toUpperCase();

  const match = m.match(/(DC|FJ|FB|IO|HQ|FN)\d{4}-\d{3}/);
  if (match) return match[0];

  const compact = m.match(/(DC|FJ|FB|IO|HQ|FN)\d{7}/);
  if (compact) {
    const base = compact[0];
    return base.slice(0,6) + "-" + base.slice(6);
  }

  return null;
}

// ===============================
// Keepa照合
// ===============================
async function keepaLookup(modelCandidates) {
  const keepaRows = await loadKeepaCsv();
  let matches = [];

  for (const candidate of modelCandidates) {
    const normalized = normalizeModel(candidate);
    if (!normalized) continue;

    for (const row of keepaRows) {
      const rowModel = row.model ? row.model.toUpperCase() : "";
      const rowPart = row.partNumber ? row.partNumber.toUpperCase() : "";

      if (rowModel === normalized || rowPart === normalized) {
        matches.push({
          asin: row.asin,
          model: normalized,
          brand: row.brand,
          partNumber: row.partNumber
        });
      }
    }
  }

  return matches;
}

// ===============================
// 正しい export
// ===============================
export { keepaLookup, loadKeepaCsv };
