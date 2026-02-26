const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const thumbDir = path.join(projectRoot, "assets", "images", "asanas", "thumbnail");
const fullDir = path.join(projectRoot, "assets", "images", "asanas");

console.log("아사나 이미지 생성 스크립트 실행 중...\n");

// ---- 1) lib/asanaImages.ts (썸네일 + 풀 1장)
let thumb = "export const ASANA_THUMBNAILS: Record<string, number> = {\n";
let full = "export const ASANA_FULL_IMAGES: Record<string, number> = {\n";
let thumbCount = 0;
let fullCount = 0;
for (let i = 1; i <= 183; i++) {
  const k = String(i).padStart(3, "0");
  const thumbPath = path.join(thumbDir, `${k}.png`);
  const fullPath = path.join(fullDir, `${k}_001.png`);
  if (fs.existsSync(thumbPath)) {
    thumb += `  "${k}": require("../assets/images/asanas/thumbnail/${k}.png"),\n`;
    thumbCount++;
  }
  if (fs.existsSync(fullPath)) {
    full += `  "${k}": require("../assets/images/asanas/${k}_001.png"),\n`;
    fullCount++;
  }
}
thumb = thumb.slice(0, -2) + "\n};\n\n";
full = full.slice(0, -2) + "\n};\n\n";

const asanaImagesOut = `/**
 * 아사나 이미지 로컬 소스 (image_number → require)
 * asanas 테이블 image_number와 매칭 (001~183)
 * 생성: node scripts/gen-asana-images.js
 */

${thumb}${full}export function getAsanaThumbnailSource(imageNumber?: string | null): number | null {
  if (!imageNumber) return null;
  const key = imageNumber.padStart(3, "0");
  return ASANA_THUMBNAILS[key] ?? null;
}

export function getAsanaFullImageSource(imageNumber?: string | null): number | null {
  if (!imageNumber) return null;
  const key = imageNumber.padStart(3, "0");
  return ASANA_FULL_IMAGES[key] ?? null;
}
`;

fs.writeFileSync(path.join(projectRoot, "lib", "asanaImages.ts"), asanaImagesOut);
console.log("  ✓ lib/asanaImages.ts");

// ---- 2) app/asanas/detailImages.ts (상세용 여러 장: nnn_001, nnn_002, ...)
const detailRe = /^(\d{3})_(\d{3})\.png$/;
const detailByKey = {};
try {
  const names = fs.readdirSync(fullDir);
  for (const name of names) {
    const m = name.match(detailRe);
    if (!m) continue;
    const key = m[1];
    if (!detailByKey[key]) detailByKey[key] = [];
    detailByKey[key].push(name);
  }
} catch (e) {
  console.warn("detailImages: readdir error", e.message);
}

for (const key of Object.keys(detailByKey)) {
  detailByKey[key].sort();
}

let detailLines = "export const ASANA_DETAIL_IMAGES: Record<string, any[]> = {\n";
const sortedKeys = Object.keys(detailByKey).sort();
for (const key of sortedKeys) {
  const files = detailByKey[key];
  const requires = files
    .map((f) => `require("../../assets/images/asanas/${f}")`)
    .join(", ");
  detailLines += `  "${key}": [${requires}],\n`;
}
detailLines = detailLines.slice(0, -2) + "\n};\n";

const detailImagesOut = `/**
 * 아사나 상세 이미지 (여러 장) 로컬 소스
 * assets/images/asanas/ 에서 nnn_001.png, nnn_002.png ... 스캔하여 자동 생성
 * 생성: node scripts/gen-asana-images.js
 */

${detailLines}`;

const detailPath = path.join(projectRoot, "app", "asanas", "detailImages.ts");
fs.writeFileSync(detailPath, detailImagesOut);
const detailCount = sortedKeys.length;
const detailTotalImages = sortedKeys.reduce((sum, key) => sum + detailByKey[key].length, 0);

console.log("  ✓ app/asanas/detailImages.ts");
console.log("");
console.log("아사나 이미지 생성 완료:");
console.log(`  • 썸네일(thumbnail): ${thumbCount}개`);
console.log(`  • 풀 1장(_001.png):   ${fullCount}개`);
console.log(`  • 상세 이미지:        아사나 ${detailCount}개, 이미지 ${detailTotalImages}장`);
console.log("");
