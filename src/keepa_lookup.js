// ===============================
// keepa.csv を読み込む（複数型番検索用）
// ===============================
async function loadKeepaCsv() {
  const url = "./data/keepa.csv";   // あなたの配置場所に合わせて変更

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

export { loadKeepaCsv };
