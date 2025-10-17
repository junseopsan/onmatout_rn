import fs from "fs";
import path from "path";

// ===== 설정 =====
const INPUT_FILE = "./kakao_yoga_full.json";
const OUTPUT_DIR = "./sql_output";
const BATCH_SIZE = 1000;
const TABLE = "studios";

// ===== 유틸 =====
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const json = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
console.log(`Loaded ${json.length} records`);

const sanitize = (v) => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return v;
  // 작은 따옴표 이스케이프
  return `'${String(v).replace(/'/g, "''")}'`;
};

for (let i = 0; i < json.length; i += BATCH_SIZE) {
  const chunk = json.slice(i, i + BATCH_SIZE);
  const part = Math.floor(i / BATCH_SIZE) + 1;

  const values = chunk
    .map(
      (r) => `(
    ${sanitize(r.name)},
    ${sanitize(r.address)},
    ${sanitize(r.phone)},
    ${sanitize(r.website)},
    ${sanitize(r.instagram)},
    ${sanitize(r.description)},
    ${sanitize(r.image_url)},
    ${sanitize(r.latitude)},
    ${sanitize(r.longitude)},
    ${sanitize(r.created_at)},
    ${sanitize(r.updated_at)},
    ${sanitize(r.url)}
  )`
    )
    .join(",\n");

  const sql = `
insert into ${TABLE}
(name, address, phone, website, instagram, description, image_url, latitude, longitude, created_at, updated_at, url)
values
${values};
`;

  const outPath = path.join(OUTPUT_DIR, `insert_studios_part_${part}.sql`);
  fs.writeFileSync(outPath, sql.trim(), "utf-8");
  console.log(`✅ Wrote ${outPath} (${chunk.length} rows)`);
}

console.log("🎉 All done!");
