import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    }
  );
}

test("server-renders the HouseRank app shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>HouseRank<\/title>/i);
  assert.match(html, /Home Buying Assistant/);
  assert.match(html, /House Recommendations/);
  assert.match(html, /Ask AI/);
  assert.match(html, />Saved</);
  assert.match(html, />Visited</);
  assert.match(html, />Profile</);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Building your site/i);
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
  assert.match(page, /autoAnalysisStartedRef/);
  assert.match(page, /Promise\.allSettled/);
  assert.match(analysisRoute, /web_search/);
  assert.match(analysisRoute, /json_schema/);
  assert.match(analysisRoute, /risk-adjusted investment quality/i);
  assert.match(types, /AIHouseAnalysis/);
});

test("assistant API reports missing server configuration safely", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("assistant-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  };
  const ctx = { waitUntil() {}, passThroughOnException() {} };

  const statusResponse = await worker.fetch(
    new Request("http://localhost/api/assistant"),
    env,
    ctx,
  );
  assert.equal(statusResponse.status, 200);
  assert.deepEqual(await statusResponse.json(), { configured: false, model: "gpt-5-mini" });

  const askResponse = await worker.fetch(
    new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Compare my homes" }),
    }),
    env,
    ctx,
  );
  assert.equal(askResponse.status, 503);
  assert.match((await askResponse.json()).error, /not configured/i);
});

test("house analysis API reports missing server configuration safely", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("analysis-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };

  const statusResponse = await worker.fetch(new Request("http://localhost/api/analyze-houses"), env, ctx);
  assert.equal(statusResponse.status, 200);
  assert.deepEqual(await statusResponse.json(), { configured: false, model: "gpt-5-mini", webSearch: true });

  const analysisResponse = await worker.fetch(new Request("http://localhost/api/analyze-houses", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ houses: [{ id: "sample-1" }] }),
  }), env, ctx);
  assert.equal(analysisResponse.status, 503);
  assert.match((await analysisResponse.json()).error, /not configured/i);
});
