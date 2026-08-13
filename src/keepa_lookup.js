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
