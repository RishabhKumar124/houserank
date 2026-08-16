import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships the complete HouseRank product shell", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /const title = "HouseRank"/);
  assert.match(page, /Home Buying Assistant/);
  assert.match(page, /RecommendationsTab/);
  assert.match(page, /AssistantPanel/);
  assert.match(page, /recommendations/);
  assert.match(page, /saved/);
  assert.match(page, /visited/);
  assert.match(page, /profile/);
  assert.doesNotMatch(page, /codex-preview|react-loading-skeleton|Building your site/i);
});

test("ships mobile app metadata and no starter dependency", async () => {
  const [manifest, page, profileTab, savedTab, visitedTab, assistantRoute, layout, packageJson] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/tabs/ProfileTab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/tabs/SavedTab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/tabs/VisitedTab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/assistant/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(manifest, /"display": "standalone"/);
  assert.match(manifest, /"share_target"/);
  assert.match(page, /localStorage/);
  assert.match(page, /visitFactors/);
  assert.match(page, /AssistantPanel/);
  assert.match(profileTab, /Suggested from Context/);
  assert.match(savedTab, /Saved Homes/);
  assert.match(visitedTab, /Visited Houses/);
  assert.match(profileTab, /Buyer Profile/);
  assert.match(assistantRoute, /process\.env\.OPENAI_API_KEY/);
  assert.match(assistantRoute, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /_sites-preview|SkeletonPreview/);
});

test("saved homes expose automatic GPT fit, investment, forecast, and sorting controls", async () => {
  const [page, savedTab, analysisRoute, types] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/tabs/SavedTab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/analyze-houses/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/types.ts", import.meta.url), "utf8"),
  ]);

  assert.match(savedTab, /GPT buying score/);
  assert.match(savedTab, /Investment score/);
  assert.match(savedTab, /5-year growth/);
  assert.match(savedTab, /Web sources/);
  assert.match(savedTab, /Saved homes start deep analysis automatically/);
  assert.match(savedTab, /Remove from Saved/);
  assert.match(page, /autoAnalysisStartedRef/);
  assert.match(page, /Promise\.allSettled/);
  assert.match(analysisRoute, /web_search/);
  assert.match(analysisRoute, /json_schema/);
  assert.match(analysisRoute, /risk-adjusted investment quality/i);
  assert.match(types, /AIHouseAnalysis/);
});

test("add-home intake can enrich listing details with AI", async () => {
  const [page, panel, route, types] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/HousePanels.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/enrich-listing/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/types.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /\/api\/enrich-listing/);
  assert.match(page, /mergeEnrichedDraft/);
  assert.match(page, /prepareListingImage/);
  assert.match(panel, /Fill Details with AI/);
  assert.match(panel, /Redfin screenshot/);
  assert.match(route, /web_search/);
  assert.match(route, /input_image/);
  assert.match(route, /imageInput/);
  assert.match(route, /json_schema/);
  assert.match(route, /AI listing intake is not configured/);
  assert.match(types, /ListingEnrichment/);
});

test("assistant API reports missing server configuration safely", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const route = await import("../app/api/assistant/route.ts");

  try {
    const statusResponse = await route.GET();
    assert.equal(statusResponse.status, 200);
    assert.deepEqual(await statusResponse.json(), { configured: false, model: "gpt-5-mini" });

    const askResponse = await route.POST(new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Compare my homes" }),
    }));
    assert.equal(askResponse.status, 503);
    assert.match((await askResponse.json()).error, /not configured/i);
  } finally {
    if (previousKey) process.env.OPENAI_API_KEY = previousKey;
  }
});

test("listing enrichment API reports missing server configuration safely", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const route = await import("../app/api/enrich-listing/route.ts");

  try {
    const statusResponse = await route.GET();
    assert.equal(statusResponse.status, 200);
    assert.deepEqual(await statusResponse.json(), { configured: false, model: "gpt-5-mini", webSearch: true, imageInput: true });

    const enrichmentResponse = await route.POST(new Request("http://localhost/api/enrich-listing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://www.redfin.com/WA/Bellevue/example" }),
    }));
    assert.equal(enrichmentResponse.status, 503);
    assert.match((await enrichmentResponse.json()).error, /not configured/i);
  } finally {
    if (previousKey) process.env.OPENAI_API_KEY = previousKey;
  }
});

test("house analysis API reports missing server configuration safely", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const route = await import("../app/api/analyze-houses/route.ts");

  try {
    const statusResponse = await route.GET();
    assert.equal(statusResponse.status, 200);
    assert.deepEqual(await statusResponse.json(), { configured: false, model: "gpt-5-mini", webSearch: true });

    const analysisResponse = await route.POST(new Request("http://localhost/api/analyze-houses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ houses: [{ id: "sample-1" }] }),
    }));
    assert.equal(analysisResponse.status, 503);
    assert.match((await analysisResponse.json()).error, /not configured/i);
  } finally {
    if (previousKey) process.env.OPENAI_API_KEY = previousKey;
  }
});
