const OPENAI_URL = "https://api.openai.com/v1/responses";
const MODEL = "gpt-5-mini";

export const maxDuration = 90;

type EnrichmentPayload = {
  url?: string;
  address?: string;
  profile?: Record<string, unknown>;
  image?: {
    name?: string;
    mimeType?: string;
    dataUrl?: string;
  };
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

type RawListingEnrichment = {
  listing: {
    address: string;
    price: string;
    beds: string;
    baths: string;
    sqft: string;
    year: string;
    commute: string;
    photo: string;
    notes: string;
  };
  confidence: "low" | "medium" | "high";
  summary: string;
  missingFields: string[];
  assumptions: string[];
  sourceUrls: string[];
};

type ListingImage = {
  name: string;
  mimeType: string;
  dataUrl: string;
  size: number;
};

const enrichmentSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "listing",
    "confidence",
    "summary",
    "missingFields",
    "assumptions",
    "sourceUrls",
  ],
  properties: {
    listing: {
      type: "object",
      additionalProperties: false,
      required: [
        "address",
        "price",
        "beds",
        "baths",
        "sqft",
        "year",
        "commute",
        "photo",
        "notes",
      ],
      properties: {
        address: { type: "string" },
        price: { type: "string" },
        beds: { type: "string" },
        baths: { type: "string" },
        sqft: { type: "string" },
        year: { type: "string" },
        commute: { type: "string" },
        photo: { type: "string" },
        notes: { type: "string" },
      },
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    summary: { type: "string" },
    missingFields: {
      type: "array",
      items: {
        type: "string",
        enum: ["address", "price", "beds", "baths", "sqft", "year", "commute", "photo", "notes"],
      },
      maxItems: 9,
    },
    assumptions: { type: "array", items: { type: "string" }, maxItems: 4 },
    sourceUrls: { type: "array", items: { type: "string" }, maxItems: 8 },
  },
};

function compact(value: unknown, maxLength: number) {
  const serialized = JSON.stringify(value ?? null);
  return serialized.length > maxLength
    ? `${serialized.slice(0, maxLength)}...`
    : serialized;
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
      sourceMap.set(key, {
        title: new URL(source.url).hostname.replace(/^www\./, ""),
        url: source.url,
      });
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

function extractOutputText(body: OpenAIResponseBody) {
  if (body.output_text?.trim()) return body.output_text.trim();

  const chunks: string[] = [];
  for (const item of body.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string" && content.text.trim()) {
        chunks.push(content.text.trim());
      }
    }
  }

  return chunks.join("\n").trim();
}

function cleanText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanNumericText(value: string, allowDecimal = false) {
  const pattern = allowDecimal ? /[^\d.]/g : /\D/g;
  const cleaned = value.replace(pattern, "");
  if (!cleaned) return "";
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return allowDecimal ? String(parsed) : String(Math.round(parsed));
}

function cleanYear(value: string) {
  const year = Number(cleanNumericText(value));
  const currentYear = new Date().getFullYear() + 1;
  if (!Number.isInteger(year) || year < 1700 || year > currentYear) return "";
  return String(year);
}

function cleanUrl(value: string) {
  const candidate = cleanText(value, 1_000);
  if (!candidate || !/^https?:\/\//i.test(candidate)) return "";
  try {
    const url = new URL(candidate);
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function cleanImagePayload(value: EnrichmentPayload["image"]): { image?: ListingImage; error?: string } {
  if (!value?.dataUrl) return {};

  const match = value.dataUrl.trim().match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) {
    return { error: "Upload a PNG, JPG, WEBP, or GIF listing screenshot." };
  }

  const mimeType = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const base64 = match[2].replace(/\s/g, "");
  const size = Math.ceil((base64.length * 3) / 4);
  if (size > 8_000_000) {
    return { error: "Screenshot is too large. Crop to the visible listing details and try again." };
  }

  return {
    image: {
      name: cleanText(value.name || "Listing screenshot", 120),
      mimeType,
      dataUrl: `data:${mimeType};base64,${base64}`,
      size,
    },
  };
}

function sourceForUrl(raw: string) {
  if (!raw || !/^https?:\/\//i.test(raw)) return null;
  try {
    const url = new URL(raw);
    url.hash = "";
    return {
      title: url.hostname.replace(/^www\./, ""),
      url: url.toString(),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  return Response.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: MODEL,
    webSearch: true,
    imageInput: true,
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI listing intake is not configured. Add OPENAI_API_KEY as a server secret." },
      { status: 503 },
    );
  }

  let payload: EnrichmentPayload;
  try {
    payload = (await request.json()) as EnrichmentPayload;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const url = cleanText(payload.url ?? "", 1_000);
  const address = cleanText(payload.address ?? "", 300);
  const imageResult = cleanImagePayload(payload.image);
  if (imageResult.error) {
    return Response.json({ error: imageResult.error }, { status: 400 });
  }
  const image = imageResult.image;

  if (!url && !address && !image) {
    return Response.json({ error: "Paste a listing link, attach a screenshot, or add an address first." }, { status: 400 });
  }
  if (url && !/^https?:\/\//i.test(url)) {
    return Response.json({ error: "Listing links must start with http:// or https://." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const instructions = `You are HouseRank Listing Intake. Today is ${today}.

${image ? "The user included a screenshot of a public real estate listing page, usually Redfin. Use the screenshot as the primary source and read only facts visible in the image. Use the supplied URL and address only as secondary context when the screenshot is incomplete." : "Use web search to find public listing or property facts for the supplied URL or address. Prefer the exact listing URL, brokerage/listing pages, public assessor records, county records, and reputable listing syndication pages. Do not claim access to pages hidden by login walls, anti-bot screens, or private MLS systems."} If a fact cannot be verified from the supplied screenshot or public evidence, leave that field as an empty string and include it in missingFields.

Return only property-intake facts for the form:
- address: postal property address.
- price: current asking/list price as digits only when publicly visible.
- beds, baths, sqft, year: digits only, with baths allowed as a decimal.
- commute: leave empty unless the supplied source directly states a commute duration. Do not estimate commute from the buyer profile.
- photo: only a stable direct HTTPS image URL when public and likely usable. Leave empty for screenshots.
- notes: concise verified context under 45 words, including visible HOA/property type/lot size/status details and anything the buyer should verify.

Never turn an asking price into an appraisal. Do not infer protected-class neighborhood characteristics. Keep assumptions short and sourceUrls limited to URLs actually used during web research.`;

  try {
    const inputText = `LISTING URL
${url || "Not supplied"}

ADDRESS
${address || "Not supplied"}

SCREENSHOT
${image ? `${image.name} (${image.mimeType}, ${image.size} bytes)` : "Not supplied"}

BUYER PROFILE CONTEXT
${compact(payload.profile, 6_000)}`;
    const input = image
      ? [{
          role: "user",
          content: [
            { type: "input_text", text: inputText },
            { type: "input_image", image_url: image.dataUrl, detail: "high" },
          ],
        }]
      : inputText;

    const openAIResponse = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        instructions,
        input,
        ...(image ? {} : {
          tools: [{ type: "web_search", search_context_size: "medium" }],
          include: ["web_search_call.action.sources"],
        }),
        text: {
          format: {
            type: "json_schema",
            name: "house_rank_listing_intake",
            strict: true,
            schema: enrichmentSchema,
          },
        },
        max_output_tokens: 2_500,
        store: false,
      }),
    });

    const responseBody = (await openAIResponse.json()) as OpenAIResponseBody;
    if (!openAIResponse.ok) {
      return Response.json(
        { error: responseBody.error?.message || "OpenAI could not enrich this listing." },
        { status: openAIResponse.status },
      );
    }

    const outputText = extractOutputText(responseBody);
    if (!outputText) {
      return Response.json({
        error: image
          ? "OpenAI could not read listing details from this screenshot. Try a clearer image with the Redfin header facts visible."
          : "OpenAI returned an empty listing result. Attach a Redfin screenshot to read the page directly.",
      }, { status: 502 });
    }

    let parsed: RawListingEnrichment;
    try {
      parsed = JSON.parse(outputText) as RawListingEnrichment;
    } catch {
      return Response.json({ error: "OpenAI returned unreadable listing details." }, { status: 502 });
    }

    const sourceMap = collectSources(responseBody);
    const suppliedSource = sourceForUrl(url);
    if (suppliedSource) sourceMap.set(normalizeUrl(suppliedSource.url), suppliedSource);
    const fallbackSources = [...sourceMap.values()].slice(0, 8);
    const requestedSources = (parsed.sourceUrls ?? [])
      .map((sourceUrl) => sourceMap.get(normalizeUrl(sourceUrl)))
      .filter((source): source is { title: string; url: string } => Boolean(source));
    const sources = requestedSources.length
      ? [...new Map(requestedSources.map((source) => [source.url, source])).values()]
      : fallbackSources;

    const listing = parsed.listing;
    const draft = {
      address: cleanText(listing.address, 300),
      price: cleanNumericText(listing.price),
      beds: cleanNumericText(listing.beds, true),
      baths: cleanNumericText(listing.baths, true),
      sqft: cleanNumericText(listing.sqft),
      year: cleanYear(listing.year),
      commute: cleanNumericText(listing.commute),
      photo: cleanUrl(listing.photo),
      notes: cleanText(listing.notes || parsed.summary, 500),
    };

    const missingFields = new Set(parsed.missingFields ?? []);
    (Object.entries(draft) as Array<[keyof typeof draft, string]>).forEach(([key, value]) => {
      if (!value) missingFields.add(key);
    });

    return Response.json({
      enrichment: {
        draft,
        confidence: parsed.confidence,
        summary: cleanText(parsed.summary, 240),
        missingFields: [...missingFields].slice(0, 9),
        assumptions: (parsed.assumptions ?? []).map((assumption) => cleanText(assumption, 160)).filter(Boolean).slice(0, 4),
        sources: sources.slice(0, 8),
        enrichedAt: new Date().toISOString(),
        model: MODEL,
      },
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    return Response.json(
      { error: `HouseRank could not look up this listing. Try again in a moment.${detail}` },
      { status: 502 },
    );
  }
}
