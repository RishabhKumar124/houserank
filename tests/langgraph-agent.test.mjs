import test from "node:test";
import assert from "node:assert/strict";
import { buildHouseRankGraph, evaluateHouseWithLangGraph } from "../lib/agents/houseRankGraph.ts";

test("LangGraph HouseRank multi-agent state graph compiles and executes successfully", async () => {
  const graph = buildHouseRankGraph();
  assert.ok(graph, "Graph must compile");

  const sampleHouse = {
    id: "house-1",
    address: "123 Main St, Austin, TX",
    price: 650000,
    beds: 4,
    baths: 3,
    sqft: 2400,
    year: 2018,
    visitCriteria: [
      { id: "light", label: "Natural Light", score: 2, notes: "South facing windows" },
      { id: "noise", label: "Acoustic Noise", score: 1, notes: "Quiet cul-de-sac" }
    ]
  };

  const sampleProfile = {
    location: "Austin, TX",
    income: "$200,000",
    maxPrice: "700000",
    bedrooms: "4",
    bathrooms: "3",
    context: "Growing family looking for strong school district and natural light."
  };

  const synthesis = await evaluateHouseWithLangGraph(sampleHouse, sampleProfile);
  assert.equal(synthesis.houseId, "house-1");
  assert.ok(synthesis.buyingScore >= 0 && synthesis.buyingScore <= 100);
  assert.ok(synthesis.investmentScore >= 0 && synthesis.investmentScore <= 100);
  assert.ok(synthesis.fiveYearMid >= synthesis.fiveYearLow);
  assert.ok(synthesis.fiveYearHigh >= synthesis.fiveYearMid);
  assert.ok(Array.isArray(synthesis.buyingReasons) && synthesis.buyingReasons.length > 0);
  assert.ok(Array.isArray(synthesis.investmentReasons) && synthesis.investmentReasons.length > 0);
});
