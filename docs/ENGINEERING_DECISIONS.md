# Engineering decisions

This document captures the choices that shape HouseRank and the tradeoffs behind them.

## 1. Keep the baseline independent from GPT

**Decision:** The primary profile and visit score is deterministic. GPT analysis is a separate, visible layer.

**Why:** A buyer should still be able to understand why a home ranks well when the API is unavailable, slow, or wrong. Separating the scores also makes disagreements useful: a high emotional fit with weak investment evidence is a decision signal, not a value to average away.

**Tradeoff:** Users see more than one number. The UI must label them clearly.

## 2. Use local-first persistence for the personal-use stage

**Decision:** Store profiles, notes, visit ratings, and research results in browser storage with JSON backup.

**Why:** It avoids creating an identity and sensitive-data backend before the product needs one. The app works immediately and has a small privacy surface.

**Tradeoff:** There is no cross-device sync, collaboration, or guaranteed recovery after browser data is cleared.

## 3. Run deep research automatically only for new saves

**Decision:** A newly saved, unanalyzed home starts deep research automatically. Stale analyses require explicit refresh.

**Why:** Saving is a strong intent signal and makes waiting feel less transactional. Re-running on every profile keystroke would be costly and could create contradictory results while the buyer is still editing.

**Tradeoff:** Deep web research can take roughly one to two minutes. Requests run independently and progressively, but the browser must remain open in this version.

## 4. Optimize investment score for risk-adjusted percentage return

**Decision:** Investment quality is not the raw future dollar value.

**Why:** A $50k asset becoming $150k has different economics from a $1m asset becoming $1.2m. Percentage return matters, but so do evidence quality, liquidity, supply, demand, condition, and carrying costs.

**Tradeoff:** The score is richer but less mechanically reproducible than the baseline. Confidence and assumptions are therefore first-class output.

## 5. Use structured output and citation allowlisting

**Decision:** The research route uses a strict JSON schema and attaches only URLs returned by the web-search tool.

**Why:** UI contracts should not depend on parsing prose, and a model should not be able to manufacture authoritative-looking source links unchecked.

**Tradeoff:** Some useful narrative citations can be dropped when URL normalization does not match exactly. The route falls back to the verified source set returned by the tool.

## 6. Avoid scraping listing portals

**Decision:** Use AI-assisted screenshot reading or web research to prefill publicly visible listing facts, without attempting portal login, private MLS access, or direct scraping.

**Why:** A portfolio-quality product should be honest about data rights and integration boundaries. User-provided screenshots make Redfin-style pages reliable without bypassing portal controls. Production listing sync should use approved APIs, licensed feeds, or user-authorized exports.

**Tradeoff:** Buyers may still need to enter or correct facts manually, and intake confidence drops when the screenshot does not show a needed field or a listing cannot be verified from public sources.

## 7. Treat fair housing as a product constraint

**Decision:** Protected characteristics cannot be neighborhood-ranking proxies. Requested amenities are treated only as distance preferences.

**Why:** Personalized real-estate software can drift into steering even when the original request sounds benign. The prompt and response normalizer enforce a narrower decision frame around property facts, finances, logistics, and objective public evidence.

**Tradeoff:** The assistant may refuse or reframe some seemingly natural neighborhood descriptions.

## 8. Keep one production path

**Decision:** Standardize development, testing, and production on the Next.js App Router runtime deployed to Vercel.

**Why:** A single supported path keeps dependency ownership clear and ensures local builds exercise the same framework contract as production.

**Tradeoff:** Alternative edge runtimes would require a deliberate adapter and verification pass rather than inheriting an unmaintained compatibility layer.
