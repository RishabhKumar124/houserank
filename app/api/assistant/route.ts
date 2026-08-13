const OPENAI_URL = "https://api.openai.com/v1/responses";
const MODEL = "gpt-5-mini";
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_HISTORY_ITEMS = 8;

type AssistantPayload = {
  message?: string;
  profile?: Record<string, unknown>;
  houses?: Array<Record<string, unknown>>;
  history?: Array<{ role?: string; content?: string }>;
};

type OpenAIResponseBody = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { message?: string };
};

function compact(value: unknown, maxLength: number) {
  const serialized = JSON.stringify(value ?? null);
  return serialized.length > maxLength
    ? `${serialized.slice(0, maxLength)}...`
    : serialized;
}

export async function GET() {
  return Response.json({ configured: Boolean(process.env.OPENAI_API_KEY), model: MODEL });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "HouseRank AI is not configured yet. Add OPENAI_API_KEY as a server secret." },
      { status: 503 },
    );
  }

  let payload: AssistantPayload;
  try {
    payload = (await request.json()) as AssistantPayload;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = payload.message?.trim().slice(0, MAX_MESSAGE_LENGTH) ?? "";
  if (!message) {
    return Response.json({ error: "Ask HouseRank a question first." }, { status: 400 });
  }

  const history = (payload.history ?? [])
    .slice(-MAX_HISTORY_ITEMS)
    .filter((item) => (item.role === "user" || item.role === "assistant") && item.content)
    .map((item) => ({ role: item.role, content: item.content!.slice(0, MAX_MESSAGE_LENGTH) }));

  const instructions = `You are HouseRank AI, a concise home-buying decision assistant.
Use only the buyer profile and tracked-house data supplied in the request. Distinguish known facts from missing information. Do not invent listing facts, crime rates, school ratings, taxes, rates, or neighborhood conditions. Recommend what the buyer should verify when evidence is missing.

Prioritize affordability, objective safety evidence, verified school assignment, commute, childcare logistics, property condition, and in-person observations. Never steer or rank neighborhoods using race, ethnicity, nationality, religion, family status, disability, or another protected characteristic. A preference such as access to a grocery store, place of worship, restaurant, childcare provider, or other named amenity may be treated only as an amenity-distance preference, never as a proxy for neighborhood demographics.

Financial output is planning guidance, not lending or investment advice. Call out assumptions. Keep answers under 450 words, use short headings and bullets when helpful, and end with a concrete next action.`;

  const context = `BUYER PROFILE\n${compact(payload.profile, 8_000)}\n\nTRACKED HOMES\n${compact(payload.houses, 18_000)}`;

  try {
    const input = [
      ...history,
      { role: "user", content: message },
    ];
    const openAIResponse = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: instructions + "\n\n" + context,
        input,
        max_output_tokens: 1200,
        store: false,
      }),
    });

    const responseBody = (await openAIResponse.json()) as OpenAIResponseBody;
    
    if (!openAIResponse.ok) {
      const message = responseBody.error?.message || "OpenAI could not answer this request.";
      return Response.json({ error: message }, { status: openAIResponse.status });
    }

    const answer = responseBody.output_text ?? responseBody.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")?.text;
    if (!answer) {
      return Response.json({ error: "OpenAI returned an empty response." }, { status: 502 });
    }

    return Response.json({ answer, model: MODEL });
  } catch (error: unknown) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    return Response.json(
      { error: `HouseRank could not reach OpenAI. Try again in a moment.${detail}` },
      { status: 502 },
    );
  }
}
