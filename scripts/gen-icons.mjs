import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const rounded = readFileSync("public/favicon.svg", "utf8");
const full = readFileSync("scripts/icon-full.svg", "utf8");

const jobs = [
  ["public/favicon-32.png", rounded, 32],
  ["public/apple-touch-icon.png", full, 180],
  ["public/icon-192.png", full, 192],
  ["public/icon-512.png", full, 512],
];

const browser = await chromium.launch();
for (const [out, svg, size] of jobs) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<style>*{margin:0}html,body{width:${size}px;height:${size}px}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  await page.waitForTimeout(120);
  await page.screenshot({ path: out, omitBackground: true });
  await page.close();
  console.log("wrote", out, `${size}px`);
}
await browser.close();
