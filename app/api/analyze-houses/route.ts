const OPENAI_URL = "https://api.openai.com/v1/responses";
const MODEL = "gpt-5-mini";
const MAX_HOUSES = 12;

export const maxDuration = 120;

type AnalysisPayload = {
  profile?: Record<string, unknown>;
  houses?: Array<Record<string, unknown>>;
};

type UrlCitation = {
  type?: string;
  title?: string;
  url?: string;
};

type OpenAIOutputItem = {
  type?: string;
  action?: {
    sources?: Array<{ type?: string; url?: string }>;
  };
  content?: Array<{
    type?: string;
    text?: string;
    annotations?: UrlCitation[];
  }>;
};

type OpenAIResponseBody = {
  output_text?: string;
  output?: OpenAIOutputItem[];
  error?: { message?: string };
};

type RawAnalysis = {
  houseId: string;
  buyingScore: number;
  investmentScore: number;
  currentValue: number;
  fiveYearLow: number;
  fiveYearMid: number;
  fiveYearHigh: number;
  confidence: "low" | "medium" | "high";
  summary: string;
  buyingReasons: string[];
  investmentReasons: string[];
  risks: string[];
  assumptions: string[];
  sourceUrls: string[];
};

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["analyses"],
  properties: {
    analyses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "houseId",
          "buyingScore",
          "investmentScore",
          "currentValue",
          "fiveYearLow",
          "fiveYearMid",
          "fiveYearHigh",
          "confidence",
          "summary",
          "buyingReasons",
          "investmentReasons",
          "risks",
          "assumptions",
          "sourceUrls",
        ],
        properties: {
          houseId: { type: "string" },
          buyingScore: { type: "integer", minimum: 0, maximum: 100 },
          investmentScore: { type: "integer", minimum: 0, maximum: 100 },
          currentValue: { type: "number", minimum: 0 },
          fiveYearLow: { type: "number", minimum: 0 },
          fiveYearMid: { type: "number", minimum: 0 },
          fiveYearHigh: { type: "number", minimum: 0 },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          summary: { type: "string" },
          buyingReasons: { type: "array", items: { type: "string" }, maxItems: 4 },
          investmentReasons: { type: "array", items: { type: "string" }, maxItems: 4 },
          risks: { type: "array", items: { type: "string" }, maxItems: 4 },
          assumptions: { type: "array", items: { type: "string" }, maxItems: 4 },
          sourceUrls: { type: "array", items: { type: "string" }, maxItems: 8 },
        },
      },
    },
  },
};

function compact(value: unknown, maxLength: number) {
  const serialized = JSON.stringify(value ?? null);
  return serialized.length > maxLength ? `${serialized.slice(0, maxLength)}...` : serialized;
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.replace(/\/$/, "");
  }
}

function collectSources(body: OpenAIResponseBody) {
  const sourceMap = new Map<string, { title: string; url: string }>();

  for (const item of body.output ?? []) {
    for (const source of item.action?.sources ?? []) {
      if (!source.url || !/^https?:\/\//i.test(source.url)) continue;
      const key = normalizeUrl(source.url);
      sourceMap.set(key, { title: new URL(source.url).hostname.replace(/^www\./, ""), url: source.url });
    }

    for (const content of item.content ?? []) {
      for (const annotation of content.annotations ?? []) {
        if (annotation.type !== "url_citation" || !annotation.url || !/^https?:\/\//i.test(annotation.url)) continue;
        const key = normalizeUrl(annotation.url);
        sourceMap.set(key, {
          title: annotation.title?.trim() || new URL(annotation.url).hostname.replace(/^www\./, ""),
          url: annotation.url,
        });
      }
    }
  }

  return sourceMap;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function fairHousingText(value: string) {
  return value
    .replace(/family[- ](?:friendly|oriented)/gi, "residential")
    .replace(/ideal for families/gi, "well suited to the stated practical needs");
}

function fairHousingList(values: string[]) {
  return values.map(fairHousingText);
}

export async function GET() {
  return Response.json({ configured: Boolean(process.env.OPENAI_API_KEY), model: MODEL, webSearch: true });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GPT property analysis is not configured. Add OPENAI_API_KEY as a server secret." },
      { status: 503 },
    );
  }

  let payload: AnalysisPayload;
  try {
    payload = (await request.json()) as AnalysisPayload;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const houses = Array.isArray(payload.houses) ? payload.houses.slice(0, MAX_HOUSES) : [];
  if (!houses.length) {
    return Response.json({ error: "Choose at least one saved home to analyze." }, { status: 400 });
  }

  const validIds = new Set(houses.map((house) => String(house.id ?? "")).filter(Boolean));
  if (!validIds.size) {
    return Response.json({ error: "Each home needs an id." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const instructions = `You are HouseRank Research, a rigorous residential real-estate decision analyst. Today is ${today}.

Use web search before scoring every home. Research the exact address and listing URL when possible, then current city or neighborhood market data, official planning or infrastructure information, objective public-safety sources, school-assignment sources, taxes, insurance or HOA context, and supply-demand signals. Prefer government, county, school-district, and reputable market-data sources. If an address, listing, school assignment, or property fact cannot be verified, say so and lower confidence. Never turn an asking price into a claimed appraisal.

BUYING SCORE (0-100): how well the home fits this specific buyer. Weight affordability and reserves, explicit profile needs, property facts, commute and daily logistics, objective safety evidence, verified school assignment, and visit notes. Treat the supplied baseline score as one transparent input, not the answer.

INVESTMENT SCORE (0-100): risk-adjusted investment quality, not raw dollar gain. Weight expected percentage appreciation relative to local alternatives (35%), price versus defensible comps or market level (20%), durable demand and resale liquidity (15%), supply and infrastructure outlook (15%), and carrying-cost or property-condition risk (15%). A $50k home rising to $150k has greater percentage upside than a $1m home rising to $1.2m, but score down speculative, illiquid, or weakly evidenced forecasts.

FIVE-YEAR VALUE: give nominal low, midpoint, and high estimates five years from now. Use the asking price as currentValue when no stronger verified valuation exists. Keep low <= midpoint <= high. Explain uncertainty through confidence, risks, and assumptions. This is planning analysis, not an appraisal, lending advice, or a promise of return.

Fair-housing guardrail: never rank or characterize locations by race, ethnicity, nationality, religion, disability, sex, or family status. A requested grocery, restaurant, childcare, park, commute, or place-of-worship proximity is only an amenity-distance preference, never a demographic proxy.

Return one result for every supplied house id. Keep each summary under 55 words and each reason under 22 words. sourceUrls must contain only URLs actually used during web research.`;

  try {
    const openAIResponse = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        instructions,
        input: `BUYER PROFILE\n${compact(payload.profile, 10_000)}\n\nSAVED HOMES\n${compact(houses, 30_000)}`,
        tools: [{ type: "web_search", search_context_size: "high" }],
        include: ["web_search_call.action.sources"],
        text: {
          format: {
            type: "json_schema",
            name: "house_rank_research",
            strict: true,
            schema: analysisSchema,
          },
        },
        max_output_tokens: 7_500,
        store: false,
      }),
    });

    const responseBody = (await openAIResponse.json()) as OpenAIResponseBody;
    if (!openAIResponse.ok) {
      return Response.json(
        { error: responseBody.error?.message || "OpenAI could not complete the property research." },
        { status: openAIResponse.status },
      );
    }

    const outputText = responseBody.output_text ?? responseBody.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")?.text;
    if (!outputText) {
      return Response.json({ error: "OpenAI returned an empty property analysis." }, { status: 502 });
    }

    let parsed: { analyses?: RawAnalysis[] };
    try {
      parsed = JSON.parse(outputText) as { analyses?: RawAnalysis[] };
    } catch {
      return Response.json({ error: "OpenAI returned an unreadable property analysis." }, { status: 502 });
    }

    const sourceMap = collectSources(responseBody);
    const fallbackSources = [...sourceMap.values()].slice(0, 8);
    const analyzedAt = new Date().toISOString();
    const analyses = (parsed.analyses ?? [])
      .filter((analysis) => validIds.has(analysis.houseId))
      .map((analysis) => {
        const currentValue = Math.max(0, Math.round(analysis.currentValue));
        const fiveYearLow = Math.max(0, Math.round(analysis.fiveYearLow));
        const fiveYearMid = Math.max(fiveYearLow, Math.round(analysis.fiveYearMid));
        const fiveYearHigh = Math.max(fiveYearMid, Math.round(analysis.fiveYearHigh));
        const requestedSources = (analysis.sourceUrls ?? [])
          .map((url) => sourceMap.get(normalizeUrl(url)))
          .filter((source): source is { title: string; url: string } => Boolean(source));
        const sources = requestedSources.length ? [...new Map(requestedSources.map((source) => [source.url, source])).values()] : fallbackSources;

        return {
          houseId: analysis.houseId,
          buyingScore: clampScore(analysis.buyingScore),
          investmentScore: clampScore(analysis.investmentScore),
          currentValue,
          fiveYearLow,
          fiveYearMid,
          fiveYearHigh,
          fiveYearGrowthPct: currentValue > 0 ? Math.round(((fiveYearMid / currentValue) - 1) * 1_000) / 10 : 0,
          confidence: analysis.confidence,
          summary: fairHousingText(analysis.summary),
          buyingReasons: fairHousingList(analysis.buyingReasons),
          investmentReasons: fairHousingList(analysis.investmentReasons),
          risks: fairHousingList(analysis.risks),
          assumptions: fairHousingList(analysis.assumptions),
          sources: sources.slice(0, 8),
          analyzedAt,
          model: MODEL,
          stale: false,
        };
      });

    if (analyses.length !== validIds.size) {
      return Response.json({ error: "The research result did not cover every selected home. Please retry." }, { status: 502 });
    }

    return Response.json({ analyses, model: MODEL, researchedAt: analyzedAt });
  } catch (error: unknown) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    return Response.json(
      { error: `HouseRank could not complete web research. Try again in a moment.${detail}` },
      { status: 502 },
    );
  }
}
