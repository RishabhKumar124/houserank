import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.env.HOUSERANK_URL ?? "https://housebuyer-app.vercel.app";
const outputDir = new URL("../docs/assets/", import.meta.url);

function analysisFor(house) {
  const isSomerset = String(house.address).includes("Somerset");
  const currentValue = Number(house.price) || (isSomerset ? 1_585_000 : 1_710_000);
  const fiveYearMid = isSomerset ? 1_820_000 : 1_983_000;

  return {
    houseId: String(house.id),
    buyingScore: isSomerset ? 86 : 68,
    investmentScore: isSomerset ? 78 : 55,
    currentValue,
    fiveYearLow: isSomerset ? 1_430_000 : 1_470_000,
    fiveYearMid,
    fiveYearHigh: isSomerset ? 2_060_000 : 2_288_000,
    fiveYearGrowthPct: Math.round(((fiveYearMid / currentValue) - 1) * 1_000) / 10,
    confidence: "medium",
    summary: isSomerset
      ? "Somerset-area fit supports the buyer's school, safety, space, and commute priorities. Verify the exact listing and inspection details before an offer."
      : "Strong amenity access and usable space, with price stretch and unverified school assignment reducing personal fit and confidence.",
    buyingReasons: ["Four-bedroom layout supports the stated space needs.", "Price remains inside the buyer's defined search band."],
    investmentReasons: ["Bellevue demand supports long-term resale liquidity.", "Limited single-family supply supports the five-year case."],
    risks: ["Exact listing facts require agent verification.", "Interest rates and inventory can change the forecast."],
    assumptions: ["No major inspection or insurance issues.", "The buyer retains cash reserves after closing."],
    sources: [
      { title: "City of Bellevue", url: "https://bellevuewa.gov/city-government/departments/community-development/neighborhoods/neighborhood-profiles" },
      { title: "Bellevue School District", url: "https://www.bsd405.org/about-us/schools/find-your-school" },
    ],
    analyzedAt: "2026-08-14T12:00:00.000Z",
    model: "gpt-5-mini",
    stale: false,
  };
}

async function installResearchMock(page) {
  await page.route("**/api/analyze-houses", async (route) => {
    const payload = route.request().postDataJSON();
    const houses = Array.isArray(payload?.houses) ? payload.houses : [];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ analyses: houses.map(analysisFor), model: "gpt-5-mini" }),
    });
  });
}

await mkdir(fileURLToPath(outputDir), { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: "light",
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await installResearchMock(page);

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.screenshot({ path: fileURLToPath(new URL("houserank-dashboard.png", outputDir)) });

await page.getByRole("button", { name: /^Saved/ }).click();
await page.getByText(/2 analyzed/).waitFor({ state: "visible" });
await page.waitForTimeout(500);
const researchCard = page.locator('article[aria-label^="GPT research"]').first();
await researchCard.scrollIntoViewIfNeeded();
await page.screenshot({ path: fileURLToPath(new URL("houserank-research.png", outputDir)) });

await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: /^Saved/ }).click();
await researchCard.scrollIntoViewIfNeeded();
await page.screenshot({ path: fileURLToPath(new URL("houserank-mobile.png", outputDir)) });

await page.setViewportSize({ width: 1200, height: 630 });
await page.getByRole("button", { name: /^Recommendations/ }).click();
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: fileURLToPath(new URL("../public/og.png", import.meta.url)) });

await browser.close();
console.log(`Captured HouseRank screenshots from ${baseUrl}`);
