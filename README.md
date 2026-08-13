# HouseRank

A local-first home buying assistant for comparing listings, scoring house tours,
and keeping the emotional details from blurring together after several showings.

## What it does

- Tracks Zillow, Redfin, Realtor, Homes.com, Compass, and manual listing links.
- Stores profile filters such as budget, beds, baths, commute, neighborhoods,
  must-haves, dealbreakers, and custom buyer context.
- Scores each home from profile fit plus 20 in-person showing factors.
- Adds a phone-installable PWA shell with share-target metadata.
- Saves everything in browser storage and supports JSON backup import/export.

## Data approach

This first version is intentionally local-first. Direct login-based sync with
listing portals should use approved APIs, partner feeds, or user-authorized
exports before replacing manual fields.

## Commands

```bash
npm run dev
npm run build
npm test
```
