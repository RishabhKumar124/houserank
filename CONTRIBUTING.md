# Contributing

Thanks for taking an interest in HouseRank.

## Development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The OpenAI key is optional for deterministic scoring and UI work.

## Before opening a pull request

```bash
npm run check
npm run build
```

For visible changes, verify one desktop viewport and a `390 x 844` mobile viewport. Include screenshots in the pull request.

## Change principles

- Preserve the distinction between deterministic and AI-generated scores.
- Show uncertainty instead of inventing listing, school, safety, or market facts.
- Never use protected characteristics as location-ranking proxies.
- Keep API keys and private buyer data out of commits, fixtures, issues, and screenshots.
- Prefer approved property-data APIs over scraping.
- Keep mobile tour workflows fast and reachable with one hand.

## Commit style

Use a short imperative subject, for example:

```text
Add confidence filter to saved homes
```

## Reporting problems

Use the issue templates for bugs and product proposals. Report security issues through a [private security advisory](https://github.com/RishabhKumar124/houserank/security/advisories/new).
