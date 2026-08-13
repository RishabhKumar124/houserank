"use client";

import {
  AlertTriangle,
  Baby,
  Bath,
  BedDouble,
  Calculator,
  Car,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  Download,
  GraduationCap,
  Home,
  Link as LinkIcon,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Star,
  Sun,
  Target,
  Trash2,
  Upload,
  Utensils,
  Volume2,
  Wind,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Profile = {
  location: string;
  income: string;
  savings: string;
  stocks: string;
  retirement: string;
  monthlyDebt: string;
  downPaymentPct: string;
  safetyPriority: string;
  schoolPriority: string;
  minPrice: string;
  maxPrice: string;
  beds: string;
  baths: string;
  commute: string;
  neighborhoods: string;
  mustHaves: string;
  dealBreakers: string;
  context: string;
};

type DraftListing = {
  url: string;
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

type HouseStatus = "Saved" | "Touring" | "Seen" | "Contender" | "Offer";

type House = {
  id: string;
  source: string;
  url: string;
  address: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  year?: number;
  commute?: number;
  photo: string;
  notes: string;
  status: HouseStatus;
  criteria: Record<string, number>;
};

type Score = {
  total: number;
  base: number;
  visitDelta: number;
  financeFit: number;
  familyFit: number;
  label: string;
  flags: string[];
};

type Suggestion = {
  minPrice: number;
  maxPrice: number;
  stretchPrice: number;
  downPayment: number;
  cashReserve: number;
  monthlyBudget: number;
  beds: number;
  baths: number;
  commute: number;
  location: string;
  neighborhoods: string;
  mustHaves: string;
  dealBreakers: string;
  rationale: string[];
  cautions: string[];
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "houserank-local-v2";
const ASSUMED_RATE = 0.067;
const ASSUMED_TAX_INSURANCE_RATE = 0.0135;
const DEFAULT_RESERVE_MONTHS = 6;

const defaultProfile: Profile = {
  location: "Bellevue, WA",
  income: "350000",
  savings: "375000",
  stocks: "200000",
  retirement: "100000",
  monthlyDebt: "",
  downPaymentPct: "20",
  safetyPriority: "Very high",
  schoolPriority: "Very high",
  minPrice: "1200000",
  maxPrice: "1700000",
  beds: "3",
  baths: "2.5",
  commute: "30",
  neighborhoods:
    "Bellevue, WA. Prioritize safe residential streets, Bellevue School District fit, parks, daycare route, sidewalks, and Indian grocery/community access.",
  mustHaves:
    "Safe street, excellent schools, quiet bedrooms, baby-safe stairs, parks nearby, daycare route, good kitchen ventilation, storage",
  dealBreakers:
    "Crime concerns, poor school fit, water damage, heavy road noise, unsafe stairs, poor kitchen exhaust",
  context:
    "Indian couple with a 1-year-old daughter looking in Bellevue. Combined income is 350k. Assets: 375k savings, 200k stocks, 100k retirement. Safety is very important. Good schooling should be assumed from the family context. We cook often and care about quiet sleep, safe stairs, parks, daycare, schools, and nearby Indian groceries or community.",
};

const sampleCriteria: Record<string, number> = {
  noise: 1,
  light: 2,
  smell: 1,
  layout: 1,
  safety: 1,
};

const sampleHouses: House[] = [
  {
    id: "sample-1",
    source: "Zillow",
    url: "https://www.zillow.com/",
    address: "1488 Somerset Ridge Dr, Bellevue",
    price: 1585000,
    beds: 4,
    baths: 3,
    sqft: 2480,
    year: 1998,
    commute: 24,
    photo:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
    notes:
      "Bellevue School District, quiet residential street, pantry, parks nearby, newer HVAC. Verify elementary assignment, street lighting, kitchen exhaust, and stair gate fit.",
    status: "Contender",
    criteria: { ...sampleCriteria, schools: 2, neighborhood: 2, kitchen: 1, community: 1 },
  },
  {
    id: "sample-2",
    source: "Redfin",
    url: "https://www.redfin.com/",
    address: "72 Lake Hills Connector, Bellevue",
    price: 1325000,
    beds: 3,
    baths: 2,
    sqft: 1760,
    year: 1987,
    commute: 32,
    photo:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=80",
    notes:
      "Good price for Bellevue and strong natural light. Some road noise from the back deck during rush hour; verify school boundary and toddler-safe yard.",
    status: "Seen",
    criteria: { noise: -1, light: 2, layout: 1, schools: 1, safety: 0, storage: 0 },
  },
  {
    id: "sample-3",
    source: "Realtor",
    url: "https://www.realtor.com/",
    address: "309 Crossroads Garden Ln, Bellevue",
    price: 1710000,
    beds: 4,
    baths: 2.5,
    sqft: 2320,
    year: 2006,
    commute: 27,
    photo:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    notes:
      "Walkable to parks and shopping, larger layout, strong storage. Slightly above suggested range; verify neighborhood noise after school pickup hours.",
    status: "Touring",
    criteria: { noise: 1, light: 1, smell: 2, storage: 2, outdoor: 1, schools: 2, safety: 1 },
  },
];

const emptyDraft: DraftListing = {
  url: "",
  address: "",
  price: "",
  beds: "",
  baths: "",
  sqft: "",
  year: "",
  commute: "",
  photo: "",
  notes: "",
};

const visitFactors = [
  {
    id: "noise",
    label: "Noise",
    icon: Volume2,
    weight: 1.35,
    low: "traffic, neighbors, mechanical hum",
    high: "quiet bedrooms, calm street",
  },
  {
    id: "light",
    label: "Natural light",
    icon: Sun,
    weight: 1.05,
    low: "dark rooms, blocked windows",
    high: "bright where you live most",
  },
  {
    id: "smell",
    label: "Air and smell",
    icon: Wind,
    weight: 1.2,
    low: "musty, smoke, pet, heavy perfume",
    high: "neutral air, good ventilation",
  },
  {
    id: "layout",
    label: "Layout flow",
    icon: Home,
    weight: 1.05,
    low: "awkward rooms, wasted halls",
    high: "easy daily movement",
  },
  {
    id: "safety",
    label: "Safety",
    icon: Baby,
    weight: 1.55,
    low: "unsafe stairs, poor lighting, blind spots",
    high: "safe street, visible play zones, secure entries",
  },
  {
    id: "kitchen",
    label: "Kitchen use",
    icon: Utensils,
    weight: 1.15,
    low: "weak exhaust, tiny prep space",
    high: "vented, practical, storage rich",
  },
  {
    id: "storage",
    label: "Storage",
    icon: Save,
    weight: 0.9,
    low: "closets too small",
    high: "pantry, garage, linen space",
  },
  {
    id: "moisture",
    label: "Moisture signs",
    icon: AlertTriangle,
    weight: 1.35,
    low: "stains, bubbling paint, dampness",
    high: "dry, clean under sinks",
  },
  {
    id: "systems",
    label: "Systems",
    icon: SlidersHorizontal,
    weight: 1.15,
    low: "old HVAC, weak panel, plumbing doubts",
    high: "maintained roof, HVAC, panel",
  },
  {
    id: "water",
    label: "Water pressure",
    icon: Wind,
    weight: 0.85,
    low: "weak fixtures, slow drains",
    high: "steady flow, clean drains",
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: ShieldCheck,
    weight: 0.9,
    low: "neighbors looking straight in",
    high: "comfortable setbacks",
  },
  {
    id: "neighborhood",
    label: "Street feel",
    icon: MapPin,
    weight: 1.05,
    low: "poor walk feel, upkeep concerns",
    high: "calm, cared for, welcoming",
  },
  {
    id: "parking",
    label: "Parking",
    icon: Car,
    weight: 0.75,
    low: "tight driveway, no guest spots",
    high: "easy daily parking",
  },
  {
    id: "outdoor",
    label: "Outdoor space",
    icon: Home,
    weight: 0.85,
    low: "unsafe, unusable, drainage issues",
    high: "playable, shaded, useful",
  },
  {
    id: "schools",
    label: "Schools and care",
    icon: GraduationCap,
    weight: 1.45,
    low: "weak boundary fit or few care options",
    high: "strong school path, daycare, parks",
  },
  {
    id: "commutefeel",
    label: "Commute feel",
    icon: Car,
    weight: 0.85,
    low: "stressful approach",
    high: "repeatable, predictable",
  },
  {
    id: "maintenance",
    label: "Renovation load",
    icon: ClipboardCheck,
    weight: 1.0,
    low: "too many urgent projects",
    high: "work is optional or clear",
  },
  {
    id: "energy",
    label: "Comfort",
    icon: CheckCircle2,
    weight: 0.9,
    low: "drafts, hot spots, old windows",
    high: "even temperature, efficient",
  },
  {
    id: "community",
    label: "Community fit",
    icon: Star,
    weight: 0.95,
    low: "isolating location",
    high: "groceries, worship, friends nearby",
  },
  {
    id: "gut",
    label: "Gut feel",
    icon: Star,
    weight: 1.15,
    low: "you are rationalizing it",
    high: "you can imagine living there",
  },
] as const;

const statusOptions: HouseStatus[] = [
  "Saved",
  "Touring",
  "Seen",
  "Contender",
  "Offer",
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: string | number | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (!value) {
    return undefined;
  }
  const cleaned = String(value).replace(/[$,\s]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function coerceMoney(value: string | number | undefined) {
  return toNumber(value) ?? 0;
}

function moneyFromContext(context: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = context.match(pattern);
    if (!match?.[1]) continue;
    const raw = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(raw)) continue;
    const suffix = match[2]?.toLowerCase();
    if (suffix === "m" || suffix === "million") return raw * 1000000;
    if (suffix === "k" || raw < 1000) return raw * 1000;
    return raw;
  }
  return 0;
}

function inferredFinance(profile: Profile) {
  const context = profile.context.toLowerCase();
  return {
    income:
      coerceMoney(profile.income) ||
      moneyFromContext(context, [
        /(?:combined\s+)?income(?:\s+is|\s*:)?\s*\$?\s*([\d,.]+)\s*(k|m|million)?/i,
        /\$?\s*([\d,.]+)\s*(k|m|million)?\s+(?:combined\s+)?income/i,
      ]),
    savings:
      coerceMoney(profile.savings) ||
      moneyFromContext(context, [
        /(?:savings|cash)(?:\s+is|\s*:)?\s*\$?\s*([\d,.]+)\s*(k|m|million)?/i,
        /\$?\s*([\d,.]+)\s*(k|m|million)?\s+(?:in\s+)?(?:savings|cash)/i,
      ]),
    stocks:
      coerceMoney(profile.stocks) ||
      moneyFromContext(context, [
        /(?:stocks|brokerage|equities)(?:\s+is|\s*:)?\s*\$?\s*([\d,.]+)\s*(k|m|million)?/i,
        /\$?\s*([\d,.]+)\s*(k|m|million)?\s+(?:in\s+)?(?:stocks|brokerage|equities)/i,
      ]),
    retirement:
      coerceMoney(profile.retirement) ||
      moneyFromContext(context, [
        /(?:retirement|401k|ira)(?:\s+is|\s*:)?\s*\$?\s*([\d,.]+)\s*(k|m|million)?/i,
        /\$?\s*([\d,.]+)\s*(k|m|million)?\s+(?:in\s+)?(?:retirement|401k|ira)/i,
      ]),
    monthlyDebt: coerceMoney(profile.monthlyDebt),
  };
}

function formatMoney(value?: number) {
  if (!value || !Number.isFinite(value)) return "Not set";
  return money.format(Math.round(value));
}

function monthlyPayment(principal: number, annualRate = ASSUMED_RATE, years = 30) {
  const monthlyRate = annualRate / 12;
  const payments = years * 12;
  if (!principal || principal <= 0) return 0;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, payments)) /
    (Math.pow(1 + monthlyRate, payments) - 1)
  );
}

function estimateMonthlyHousing(price: number, downPaymentPct: number) {
  const downPayment = price * downPaymentPct;
  const principal = Math.max(0, price - downPayment);
  const mortgage = monthlyPayment(principal);
  const taxInsuranceHoa = (price * ASSUMED_TAX_INSURANCE_RATE) / 12 + 450;
  return mortgage + taxInsuranceHoa;
}

function terms(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 2);
}

function labelForScore(score: number) {
  if (score >= 86) return "Strong match";
  if (score >= 74) return "Tour again";
  if (score >= 62) return "Promising";
  if (score >= 48) return "Tradeoffs";
  return "Likely pass";
}

function sourceFromUrl(raw: string) {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host.includes("zillow")) return "Zillow";
    if (host.includes("redfin")) return "Redfin";
    if (host.includes("realtor")) return "Realtor";
    if (host.includes("homes.com")) return "Homes.com";
    if (host.includes("compass")) return "Compass";
    return host.replace(/^www\./, "");
  } catch {
    return raw ? "Listing link" : "Manual";
  }
}

function titleCaseSlug(slug: string) {
  return decodeURIComponent(slug)
    .replace(/_zpid.*$/i, "")
    .replace(/-home.*$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferAddress(raw: string) {
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    if (!parts.length) return "";

    if (url.hostname.includes("redfin")) {
      const homeIndex = parts.findIndex((part) => part.toLowerCase() === "home");
      if (homeIndex > 0) {
        return titleCaseSlug(parts[homeIndex - 1]);
      }
    }

    const likely = parts.find((part) =>
      /\d/.test(part) && /[a-z]/i.test(part) && part.length > 5
    );
    return likely ? titleCaseSlug(likely) : "";
  } catch {
    return "";
  }
}

function formatNumber(value?: number, suffix = "") {
  if (!value) return "Not set";
  return `${new Intl.NumberFormat("en-US").format(value)}${suffix}`;
}

function inferSuggestion(profile: Profile): Suggestion {
  const context = profile.context.toLowerCase();
  const finance = inferredFinance(profile);
  const income = finance.income;
  const savings = finance.savings;
  const stocks = finance.stocks;
  const monthlyDebt = finance.monthlyDebt;
  const location =
    profile.location.trim() ||
    (context.includes("bellevue") ? "Bellevue, WA" : "Target area");
  const hasChild =
    /baby|daughter|son|child|kid|toddler|1[-\s]?year|one year/i.test(profile.context);
  const indianFamily = /indian|desi|hindu|temple|grocery|spice/i.test(profile.context);
  const safetyHigh =
    profile.safetyPriority.toLowerCase().includes("high") ||
    /safe|safety|crime|secure/i.test(profile.context);
  const schoolHigh =
    profile.schoolPriority.toLowerCase().includes("high") ||
    /school|daycare|preschool|child|daughter|baby/i.test(profile.context);
  const downPct = clamp((toNumber(profile.downPaymentPct) ?? 20) / 100, 0.05, 0.5);
  const grossMonthly = income / 12;
  const monthlyBudget = Math.max(0, grossMonthly * 0.32 - monthlyDebt);
  const liquidAssets = savings + stocks * 0.75;
  const reserve = Math.max(grossMonthly * DEFAULT_RESERVE_MONTHS, 95000);
  const cashAvailableForPurchase = Math.max(0, liquidAssets - reserve);
  const byCash = cashAvailableForPurchase / downPct;

  let byIncome = 0;
  if (monthlyBudget > 0) {
    let low = 300000;
    let high = 3500000;
    for (let i = 0; i < 42; i += 1) {
      const mid = (low + high) / 2;
      if (estimateMonthlyHousing(mid, downPct) <= monthlyBudget) {
        low = mid;
      } else {
        high = mid;
      }
    }
    byIncome = low;
  }

  const bellevueMarket = location.toLowerCase().includes("bellevue");
  const marketFloor = bellevueMarket ? 1650000 : 950000;
  const paymentComfortMax = byIncome || marketFloor;
  const liquidityMax = byCash || paymentComfortMax;
  const blendedMax = Math.max(marketFloor, paymentComfortMax * 0.9);
  const recommendedMax = Math.round(blendedMax / 25000) * 25000;
  const safeMax = Math.max(marketFloor, recommendedMax || marketFloor);
  const minPrice = bellevueMarket
    ? 1200000
    : Math.max(900000, Math.round(safeMax * 0.74 / 25000) * 25000);
  const stretchPrice = Math.max(
    safeMax + 50000,
    Math.round(Math.max(paymentComfortMax, safeMax * 1.12) / 25000) * 25000
  );
  const beds = hasChild ? 3 : 2;
  const baths = hasChild ? 2.5 : 2;
  const commute = location.toLowerCase().includes("bellevue") ? 30 : 35;

  const mustHaves = [
    safetyHigh ? "safe residential street" : "comfortable street feel",
    schoolHigh ? "excellent school boundary" : "school fit",
    hasChild ? "daycare route, parks nearby, baby-safe stairs, quiet nursery" : "quiet bedrooms",
    indianFamily ? "good kitchen ventilation, pantry, Indian grocery/community access" : "practical kitchen",
    "inspection-friendly roof, HVAC, drainage, and electrical",
  ].join(", ");

  const dealBreakers = [
    safetyHigh ? "crime concerns, poor lighting, unsafe street" : "poor street feel",
    schoolHigh ? "poor school fit" : "school uncertainty",
    "water damage, heavy road noise, unsafe stairs, poor kitchen exhaust, major unpriced repairs",
  ].join(", ");

  const neighborhoods = [
    location,
    safetyHigh ? "quiet low-traffic residential streets" : "comfortable neighborhood feel",
    schoolHigh ? "Bellevue School District boundary verification" : "school and commute verification",
    hasChild ? "parks, sidewalks, daycare route, pediatric access" : "parks and errands",
    indianFamily ? "Indian grocery, restaurants, temple/community routes within a reasonable drive" : "",
  ]
    .filter(Boolean)
    .join(", ");

  const rationale = [
    income
      ? `${formatMoney(income)} income supports roughly ${formatMoney(monthlyBudget)} monthly housing before taxes and debt nuance.`
      : "Add income to estimate the search band.",
    `${formatMoney(savings)} savings plus a conservative portion of stocks leaves about ${formatMoney(cashAvailableForPurchase)} after a ${DEFAULT_RESERVE_MONTHS}-month reserve.`,
    hasChild
      ? "A 1-year-old makes safety, school path, daycare route, parks, stairs, and sleep noise primary filters."
      : "Family context can be used to prioritize neighborhood fit.",
    location.toLowerCase().includes("bellevue")
      ? "Bellevue generally pushes the search toward townhomes or smaller single-family homes unless you stretch budget."
      : "Location drives price band and commute assumptions.",
  ];

  const cautions = [
    "Use this as a search range, then confirm with lender preapproval, taxes, insurance, HOA, and childcare costs.",
    "Do not count retirement funds for down payment unless you deliberately choose to do that.",
    liquidityMax < safeMax
      ? "A 20% down payment plus closing costs may require selling more stock or choosing a lower down payment loan."
      : "Liquidity appears workable for the suggested band, before closing costs and moving costs.",
  ];

  return {
    minPrice,
    maxPrice: safeMax,
    stretchPrice,
    downPayment: Math.round(safeMax * downPct),
    cashReserve: Math.round(reserve),
    monthlyBudget: Math.round(monthlyBudget),
    beds,
    baths,
    commute,
    location,
    neighborhoods,
    mustHaves,
    dealBreakers,
    rationale,
    cautions,
  };
}

function scoreHouse(house: House, profile: Profile): Score {
  const flags: string[] = [];
  const suggestion = inferSuggestion(profile);
  const maxPrice = toNumber(profile.maxPrice);
  const minPrice = toNumber(profile.minPrice);
  const targetBeds = toNumber(profile.beds);
  const targetBaths = toNumber(profile.baths);
  const targetCommute = toNumber(profile.commute);
  const safetyHigh = profile.safetyPriority.toLowerCase().includes("high");
  const schoolHigh = profile.schoolPriority.toLowerCase().includes("high");
  let base = 62;
  let financeFit = 58;
  let familyFit = 58;

  if (house.price && maxPrice) {
    if (house.price <= maxPrice) {
      base += 8;
      financeFit += 14;
    } else {
      const over = (house.price - maxPrice) / maxPrice;
      base -= over > 0.1 ? 18 : over > 0.05 ? 10 : 5;
      financeFit -= over > 0.1 ? 28 : over > 0.05 ? 17 : 8;
      flags.push("over budget");
    }
  }

  if (house.price && house.price > suggestion.stretchPrice) {
    financeFit -= 16;
    flags.push("finance stretch");
  }

  if (house.price && minPrice && house.price < minPrice * 0.82) {
    base -= 3;
    financeFit -= 4;
    flags.push("verify pricing");
  }

  if (targetBeds && house.beds) {
    base += house.beds >= targetBeds ? 8 : -Math.min(18, (targetBeds - house.beds) * 9);
    familyFit += house.beds >= targetBeds ? 8 : -Math.min(14, (targetBeds - house.beds) * 7);
    if (house.beds < targetBeds) flags.push("bedroom gap");
  }

  if (targetBaths && house.baths) {
    base += house.baths >= targetBaths ? 6 : -Math.min(12, (targetBaths - house.baths) * 8);
    familyFit += house.baths >= targetBaths ? 5 : -Math.min(10, (targetBaths - house.baths) * 7);
    if (house.baths < targetBaths) flags.push("bath gap");
  }

  if (targetCommute && house.commute) {
    if (house.commute <= targetCommute) {
      base += 7;
      familyFit += 5;
    } else if (house.commute <= targetCommute + 10) {
      base -= 2;
      familyFit -= 4;
      flags.push("commute stretch");
    } else {
      base -= 10;
      familyFit -= 12;
      flags.push("long commute");
    }
  }

  const haystack = `${house.address} ${house.notes}`.toLowerCase();
  const musts = terms(profile.mustHaves);
  const dealBreakers = terms(profile.dealBreakers);
  const mustMatches = musts.filter((item) => haystack.includes(item));
  const dealHits = dealBreakers.filter((item) => haystack.includes(item));

  if (musts.length) {
    base += Math.min(8, mustMatches.length * 2);
    if (!mustMatches.length) base -= 4;
  }

  if (dealHits.length) {
    base -= Math.min(22, dealHits.length * 11);
    flags.push("possible dealbreaker");
  }

  const context = profile.context.toLowerCase();
  if (context.includes("baby") || context.includes("child")) {
    const safety = house.criteria.safety ?? 0;
    const noise = house.criteria.noise ?? 0;
    const schools = house.criteria.schools ?? 0;
    base += safety > 0 ? 5 : safety < 0 ? -9 : 0;
    base += noise > 0 ? 4 : noise < 0 ? -8 : 0;
    base += schools > 0 ? 5 : schools < 0 ? -9 : 0;
    familyFit += safety * 8 + noise * 5 + schools * 8;
  }
  if (context.includes("indian") || context.includes("cook")) {
    const kitchen = house.criteria.kitchen ?? 0;
    const community = house.criteria.community ?? 0;
    base += kitchen > 0 ? 3 : kitchen < 0 ? -4 : 0;
    base += community > 0 ? 2 : 0;
    familyFit += kitchen * 4 + community * 4;
  }

  if (safetyHigh) {
    const safety = house.criteria.safety ?? 0;
    const street = house.criteria.neighborhood ?? 0;
    base += safety * 5 + street * 3;
    familyFit += safety * 9 + street * 6;
    if (safety < 0 || street < 0) flags.push("safety concern");
  }

  if (schoolHigh) {
    const schools = house.criteria.schools ?? 0;
    base += schools * 5;
    familyFit += schools * 10;
    if (schools < 0) flags.push("school concern");
  }

  const totalWeight = visitFactors.reduce((sum, factor) => sum + factor.weight, 0);
  const weighted = visitFactors.reduce(
    (sum, factor) => sum + (house.criteria[factor.id] ?? 0) * factor.weight,
    0
  );
  const visitDelta = Math.round((weighted / (totalWeight * 2)) * 28);
  const total = Math.round(clamp(base + visitDelta));

  return {
    base: Math.round(clamp(base)),
    financeFit: Math.round(clamp(financeFit)),
    familyFit: Math.round(clamp(familyFit)),
    visitDelta,
    total,
    label: labelForScore(total),
    flags: [...new Set(flags)].slice(0, 3),
  };
}

function getPersonalLenses(profile: Profile) {
  const context = profile.context.toLowerCase();
  const lenses = [
    {
      icon: Volume2,
      title: "Sleep noise",
      text: "stand in bedrooms quietly and listen for road, HVAC, neighbors",
    },
    {
      icon: Wind,
      title: "Air check",
      text: "notice must, smoke, pet odor, perfume masking, and kitchen exhaust",
    },
    {
      icon: Sun,
      title: "Light path",
      text: "check morning and evening rooms, not just staged spaces",
    },
  ];

  if (context.includes("indian") || context.includes("cook")) {
    lenses.push({
      icon: Utensils,
      title: "Cooking life",
      text: "range hood, pantry, spice storage, windows, easy grocery routes",
    });
  }

  if (context.includes("baby") || context.includes("girl") || context.includes("child")) {
    lenses.push({
      icon: Baby,
      title: "Baby rhythm",
      text: "nursery quiet, stair gates, stroller path, daycare and park route",
    });
  }

  if (context.includes("parents") || context.includes("family")) {
    lenses.push({
      icon: ShieldCheck,
      title: "Family visits",
      text: "main-level bath, guest privacy, parking, flexible room use",
    });
  }

  return lenses.slice(0, 6);
}

function AppIconButton({
  children,
  label,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button className={`icon-button ${className}`} type="button" onClick={onClick} aria-label={label} title={label}>
      {children}
    </button>
  );
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [houses, setHouses] = useState<House[]>(sampleHouses);
  const [draft, setDraft] = useState<DraftListing>(emptyDraft);
  const [selectedId, setSelectedId] = useState(sampleHouses[0].id);
  const [activeStatus, setActiveStatus] = useState<HouseStatus | "All">("All");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [saveState, setSaveState] = useState("Saved locally");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hydrateLocalState = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as {
            profile?: Profile;
            houses?: House[];
            selectedId?: string;
          };
          if (parsed.profile) setProfile(parsed.profile);
          if (parsed.houses?.length) {
            setHouses(parsed.houses);
            setSelectedId(parsed.selectedId ?? parsed.houses[0].id);
          }
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }

      const params = new URLSearchParams(window.location.search);
      const sharedUrl = params.get("url") ?? params.get("text");
      if (sharedUrl && /^https?:\/\//i.test(sharedUrl)) {
        setDraft((current) => ({
          ...current,
          url: sharedUrl,
          address: inferAddress(sharedUrl),
        }));
      }
    }, 0);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      window.clearTimeout(hydrateLocalState);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profile, houses, selectedId })
    );
  }, [profile, houses, selectedId]);

  const scoredHouses = useMemo(
    () =>
      houses
        .map((house) => ({ house, score: scoreHouse(house, profile) }))
        .filter(({ house }) => activeStatus === "All" || house.status === activeStatus)
        .sort((a, b) => b.score.total - a.score.total),
    [activeStatus, houses, profile]
  );

  const selectedHouse = houses.find((house) => house.id === selectedId) ?? houses[0];
  const selectedScore = selectedHouse ? scoreHouse(selectedHouse, profile) : null;
  const best = scoredHouses[0];
  const personalLenses = useMemo(() => getPersonalLenses(profile), [profile]);
  const suggestion = useMemo(() => inferSuggestion(profile), [profile]);

  function updateProfile(key: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function applySuggestion() {
    setProfile((current) => ({
      ...current,
      location: suggestion.location,
      minPrice: String(suggestion.minPrice),
      maxPrice: String(suggestion.maxPrice),
      beds: String(suggestion.beds),
      baths: String(suggestion.baths),
      commute: String(suggestion.commute),
      neighborhoods: suggestion.neighborhoods,
      mustHaves: suggestion.mustHaves,
      dealBreakers: suggestion.dealBreakers,
      safetyPriority: suggestion.mustHaves.includes("safe")
        ? "Very high"
        : current.safetyPriority,
      schoolPriority: suggestion.mustHaves.includes("school")
        ? "Very high"
        : current.schoolPriority,
    }));
    setSaveState("Suggestions applied");
  }

  function updateHouse(id: string, patch: Partial<House>) {
    setHouses((current) =>
      current.map((house) => (house.id === id ? { ...house, ...patch } : house))
    );
  }

  function updateHouseNumber(id: string, key: keyof House, value: string) {
    updateHouse(id, { [key]: toNumber(value) } as Partial<House>);
  }

  function addListing() {
    const url = draft.url.trim();
    const address = draft.address.trim() || inferAddress(url) || "Untitled listing";
    const next: House = {
      id: `house-${Date.now()}`,
      source: sourceFromUrl(url),
      url,
      address,
      price: toNumber(draft.price),
      beds: toNumber(draft.beds),
      baths: toNumber(draft.baths),
      sqft: toNumber(draft.sqft),
      year: toNumber(draft.year),
      commute: toNumber(draft.commute),
      photo:
        draft.photo.trim() ||
        "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=900&q=80",
      notes: draft.notes.trim(),
      status: "Saved",
      criteria: {},
    };
    setHouses((current) => [next, ...current]);
    setSelectedId(next.id);
    setDraft(emptyDraft);
    setSaveState("Listing added");
  }

  function deleteHouse(id: string) {
    setHouses((current) => {
      const remaining = current.filter((house) => house.id !== id);
      if (!remaining.some((house) => house.id === selectedId)) {
        setSelectedId(remaining[0]?.id ?? "");
      }
      return remaining;
    });
  }

  function setCriterion(id: string, criterionId: string, value: number) {
    setHouses((current) =>
      current.map((house) =>
        house.id === id
          ? {
              ...house,
              criteria: {
                ...house.criteria,
                [criterionId]: value,
              },
            }
          : house
      )
    );
  }

  async function installApp() {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    window.alert("Open your browser menu and choose Add to Home Screen.");
  }

  function exportData() {
    const payload = JSON.stringify({ profile, houses }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `houserank-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          profile?: Profile;
          houses?: House[];
        };
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.houses?.length) {
          setHouses(parsed.houses);
          setSelectedId(parsed.houses[0].id);
        }
        setSaveState("Imported");
      } catch {
        window.alert("That backup file could not be read.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">
            <Home size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">HouseRank</p>
            <h1>Home buying assistant</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <span className="save-pill">{saveState}</span>
          <AppIconButton label="Install on phone" onClick={installApp}>
            <Smartphone size={18} />
          </AppIconButton>
          <AppIconButton label="Import backup" onClick={() => importInputRef.current?.click()}>
            <Upload size={18} />
          </AppIconButton>
          <AppIconButton label="Export backup" onClick={exportData}>
            <Download size={18} />
          </AppIconButton>
          <input
            ref={importInputRef}
            className="visually-hidden"
            type="file"
            accept="application/json"
            onChange={importData}
          />
        </div>
      </header>

      <section className="summary-strip" aria-label="Best match summary">
        <div className="summary-score">
          <span>{best?.score.total ?? 0}</span>
          <div>
            <strong>{best?.score.label ?? "No listings"}</strong>
            <p>{best?.house.address ?? "Add a listing to start ranking"}</p>
          </div>
        </div>
        <div className="summary-stat">
          <DollarSign size={18} />
          <span>{formatMoney(suggestion.maxPrice)} suggested max</span>
        </div>
        <div className="summary-stat">
          <GraduationCap size={18} />
          <span>Safety + schools prioritized</span>
        </div>
        <div className="summary-stat">
          <Search size={18} />
          <span>{houses.length} homes tracked</span>
        </div>
      </section>

      <section className="workspace">
        <aside className="profile-panel" aria-label="Buyer profile">
          <div className="section-heading">
            <SlidersHorizontal size={18} />
            <h2>Profile</h2>
          </div>

          <section className="recommendation-card" aria-label="Suggested buyer profile">
            <div className="recommendation-head">
              <div>
                <p className="eyebrow">Suggested from context</p>
                <h3>{suggestion.location}</h3>
              </div>
              <button className="secondary-button" type="button" onClick={applySuggestion}>
                <Target size={16} />
                Apply
              </button>
            </div>
            <div className="recommendation-grid">
              <div>
                <span>Search band</span>
                <strong>
                  {formatMoney(suggestion.minPrice)} - {formatMoney(suggestion.maxPrice)}
                </strong>
              </div>
              <div>
                <span>Stretch cap</span>
                <strong>{formatMoney(suggestion.stretchPrice)}</strong>
              </div>
              <div>
                <span>Target home</span>
                <strong>
                  {suggestion.beds}+ bd / {suggestion.baths}+ ba
                </strong>
              </div>
              <div>
                <span>Cash buffer</span>
                <strong>{formatMoney(suggestion.cashReserve)}</strong>
              </div>
            </div>
            <p className="recommendation-note">
              {suggestion.rationale[2]} {suggestion.cautions[2]} {suggestion.cautions[0]}
            </p>
          </section>

          <div className="field-grid two">
            <label>
              <span>Location</span>
              <input
                value={profile.location}
                onChange={(event) => updateProfile("location", event.target.value)}
              />
            </label>
            <label>
              <span>Combined income</span>
              <input
                inputMode="numeric"
                value={profile.income}
                onChange={(event) => updateProfile("income", event.target.value)}
              />
            </label>
            <label>
              <span>Savings</span>
              <input
                inputMode="numeric"
                value={profile.savings}
                onChange={(event) => updateProfile("savings", event.target.value)}
              />
            </label>
            <label>
              <span>Stocks</span>
              <input
                inputMode="numeric"
                value={profile.stocks}
                onChange={(event) => updateProfile("stocks", event.target.value)}
              />
            </label>
            <label>
              <span>Retirement</span>
              <input
                inputMode="numeric"
                value={profile.retirement}
                onChange={(event) => updateProfile("retirement", event.target.value)}
              />
            </label>
            <label>
              <span>Monthly debts</span>
              <input
                inputMode="numeric"
                value={profile.monthlyDebt}
                onChange={(event) => updateProfile("monthlyDebt", event.target.value)}
              />
            </label>
            <label>
              <span>Down payment %</span>
              <input
                inputMode="numeric"
                value={profile.downPaymentPct}
                onChange={(event) => updateProfile("downPaymentPct", event.target.value)}
              />
            </label>
            <label>
              <span>Safety priority</span>
              <select
                value={profile.safetyPriority}
                onChange={(event) => updateProfile("safetyPriority", event.target.value)}
              >
                <option>Very high</option>
                <option>High</option>
                <option>Normal</option>
              </select>
            </label>
            <label>
              <span>School priority</span>
              <select
                value={profile.schoolPriority}
                onChange={(event) => updateProfile("schoolPriority", event.target.value)}
              >
                <option>Very high</option>
                <option>High</option>
                <option>Normal</option>
              </select>
            </label>
          </div>

          <div className="field-grid two">
            <label>
              <span>Min price</span>
              <input
                inputMode="numeric"
                value={profile.minPrice}
                onChange={(event) => updateProfile("minPrice", event.target.value)}
              />
            </label>
            <label>
              <span>Max price</span>
              <input
                inputMode="numeric"
                value={profile.maxPrice}
                onChange={(event) => updateProfile("maxPrice", event.target.value)}
              />
            </label>
            <label>
              <span>Beds</span>
              <input
                inputMode="numeric"
                value={profile.beds}
                onChange={(event) => updateProfile("beds", event.target.value)}
              />
            </label>
            <label>
              <span>Baths</span>
              <input
                inputMode="decimal"
                value={profile.baths}
                onChange={(event) => updateProfile("baths", event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Max commute minutes</span>
            <input
              inputMode="numeric"
              value={profile.commute}
              onChange={(event) => updateProfile("commute", event.target.value)}
            />
          </label>

          <label>
            <span>Neighborhood notes</span>
            <textarea
              rows={3}
              value={profile.neighborhoods}
              onChange={(event) => updateProfile("neighborhoods", event.target.value)}
            />
          </label>

          <label>
            <span>Must haves</span>
            <textarea
              rows={3}
              value={profile.mustHaves}
              onChange={(event) => updateProfile("mustHaves", event.target.value)}
            />
          </label>

          <label>
            <span>Dealbreakers</span>
            <textarea
              rows={3}
              value={profile.dealBreakers}
              onChange={(event) => updateProfile("dealBreakers", event.target.value)}
            />
          </label>

          <label>
            <span>Context</span>
            <textarea
              rows={5}
              value={profile.context}
              onChange={(event) => updateProfile("context", event.target.value)}
            />
          </label>

          <div className="lens-grid">
            {personalLenses.map((lens) => {
              const Icon = lens.icon;
              return (
                <article className="lens-card" key={lens.title}>
                  <Icon size={18} />
                  <strong>{lens.title}</strong>
                  <p>{lens.text}</p>
                </article>
              );
            })}
          </div>

          <div className="rationale-list">
            {suggestion.rationale.map((item) => (
              <div className="rationale-item" key={item}>
                <Calculator size={16} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="listing-panel" aria-label="Listings">
          <div className="section-heading">
            <LinkIcon size={18} />
            <h2>Add listing</h2>
          </div>

          <div className="add-listing">
            <label className="wide">
              <span>Listing link</span>
              <input
                value={draft.url}
                placeholder="Paste Zillow, Redfin, Realtor, Homes.com..."
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    url: event.target.value,
                    address: current.address || inferAddress(event.target.value),
                  }))
                }
              />
            </label>
            <label>
              <span>Address</span>
              <input
                value={draft.address}
                onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
              />
            </label>
            <label>
              <span>Price</span>
              <input
                inputMode="numeric"
                value={draft.price}
                onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
              />
            </label>
            <label>
              <span>Beds</span>
              <input
                inputMode="decimal"
                value={draft.beds}
                onChange={(event) => setDraft((current) => ({ ...current, beds: event.target.value }))}
              />
            </label>
            <label>
              <span>Baths</span>
              <input
                inputMode="decimal"
                value={draft.baths}
                onChange={(event) => setDraft((current) => ({ ...current, baths: event.target.value }))}
              />
            </label>
            <label>
              <span>Sq ft</span>
              <input
                inputMode="numeric"
                value={draft.sqft}
                onChange={(event) => setDraft((current) => ({ ...current, sqft: event.target.value }))}
              />
            </label>
            <label>
              <span>Commute</span>
              <input
                inputMode="numeric"
                value={draft.commute}
                onChange={(event) => setDraft((current) => ({ ...current, commute: event.target.value }))}
              />
            </label>
            <label>
              <span>School fit</span>
              <select
                value=""
                onChange={(event) => {
                  const value = event.target.value;
                  if (!value) return;
                  setDraft((current) => ({
                    ...current,
                    notes: `${current.notes}${current.notes ? "\n" : ""}School fit: ${value}`,
                  }));
                  event.currentTarget.value = "";
                }}
              >
                <option value="">Add note</option>
                <option>verify boundary</option>
                <option>strong Bellevue school path</option>
                <option>uncertain or weak school fit</option>
              </select>
            </label>
            <label>
              <span>Street safety</span>
              <select
                value=""
                onChange={(event) => {
                  const value = event.target.value;
                  if (!value) return;
                  setDraft((current) => ({
                    ...current,
                    notes: `${current.notes}${current.notes ? "\n" : ""}Street safety: ${value}`,
                  }));
                  event.currentTarget.value = "";
                }}
              >
                <option value="">Add note</option>
                <option>quiet low-traffic street</option>
                <option>needs night check</option>
                <option>busy road or safety concern</option>
              </select>
            </label>
            <label className="wide">
              <span>Notes</span>
              <textarea
                rows={2}
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              />
            </label>
            <button className="primary-button" type="button" onClick={addListing}>
              <Plus size={18} />
              Add home
            </button>
          </div>

          <div className="filter-row" aria-label="Status filter">
            {(["All", ...statusOptions] as const).map((status) => (
              <button
                className={activeStatus === status ? "chip active" : "chip"}
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="listing-stack">
            {scoredHouses.map(({ house, score }, index) => (
              <article
                className={house.id === selectedId ? "house-card selected" : "house-card"}
                key={house.id}
              >
                <button
                  className="house-main"
                  type="button"
                  onClick={() => setSelectedId(house.id)}
                  aria-label={`Select ${house.address}`}
                >
                  <img src={house.photo} alt="" />
                  <div className="house-content">
                    <div className="house-title-row">
                      <div>
                        <span className="rank-badge">#{index + 1}</span>
                        <h3>{house.address}</h3>
                      </div>
                      <div className="score-badge">
                        <strong>{score.total}</strong>
                        <span>{score.label}</span>
                      </div>
                    </div>

                    <div className="house-facts">
                      <span>
                        <Home size={15} />
                        {money.format(house.price ?? 0)}
                      </span>
                      <span>
                        <BedDouble size={15} />
                        {house.beds ?? "?"}
                      </span>
                      <span>
                        <Bath size={15} />
                        {house.baths ?? "?"}
                      </span>
                      <span>
                        <Car size={15} />
                        {house.commute ? `${house.commute} min` : "commute ?"}
                      </span>
                    </div>

                    <p>{house.notes || "No notes yet."}</p>

                    <div className="card-footer">
                      <span>{house.source}</span>
                      <span>{house.status}</span>
                      <span>Family {score.familyFit}</span>
                      <span>Finance {score.financeFit}</span>
                      <span>Visit {score.visitDelta >= 0 ? "+" : ""}{score.visitDelta}</span>
                      {score.flags.map((flag) => (
                        <span className="warning-tag" key={flag}>{flag}</span>
                      ))}
                    </div>
                  </div>
                </button>

                <div className="house-actions">
                  <select
                    aria-label={`Status for ${house.address}`}
                    value={house.status}
                    onChange={(event) =>
                      updateHouse(house.id, { status: event.target.value as HouseStatus })
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  {house.url ? (
                    <a className="small-link" href={house.url} target="_blank" rel="noreferrer">
                      <LinkIcon size={15} />
                      Open
                    </a>
                  ) : null}
                  <AppIconButton label={`Delete ${house.address}`} onClick={() => deleteHouse(house.id)}>
                    <Trash2 size={16} />
                  </AppIconButton>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="visit-panel" aria-label="Visit scoring">
          {selectedHouse && selectedScore ? (
            <>
              <div className="visit-header">
                <div>
                  <p className="eyebrow">Showing score</p>
                  <h2>{selectedHouse.address}</h2>
                </div>
                <div className="big-score">
                  <strong>{selectedScore.total}</strong>
                  <span>{selectedScore.label}</span>
                </div>
              </div>

              <div className="score-bars">
                <div>
                  <span>Profile fit</span>
                  <meter min={0} max={100} value={selectedScore.base} />
                  <strong>{selectedScore.base}</strong>
                </div>
                <div>
                  <span>Family fit</span>
                  <meter min={0} max={100} value={selectedScore.familyFit} />
                  <strong>{selectedScore.familyFit}</strong>
                </div>
                <div>
                  <span>Finance fit</span>
                  <meter min={0} max={100} value={selectedScore.financeFit} />
                  <strong>{selectedScore.financeFit}</strong>
                </div>
                <div>
                  <span>Visit feel</span>
                  <meter min={-28} max={28} value={selectedScore.visitDelta} />
                  <strong>
                    {selectedScore.visitDelta >= 0 ? "+" : ""}
                    {selectedScore.visitDelta}
                  </strong>
                </div>
              </div>

              <div className="edit-fields">
                <label>
                  <span>Price</span>
                  <input
                    inputMode="numeric"
                    value={selectedHouse.price ?? ""}
                    onChange={(event) => updateHouseNumber(selectedHouse.id, "price", event.target.value)}
                  />
                </label>
                <label>
                  <span>Sq ft</span>
                  <input
                    inputMode="numeric"
                    value={selectedHouse.sqft ?? ""}
                    onChange={(event) => updateHouseNumber(selectedHouse.id, "sqft", event.target.value)}
                  />
                </label>
                <label>
                  <span>Year</span>
                  <input
                    inputMode="numeric"
                    value={selectedHouse.year ?? ""}
                    onChange={(event) => updateHouseNumber(selectedHouse.id, "year", event.target.value)}
                  />
                </label>
                <label>
                  <span>Photo URL</span>
                  <input
                    value={selectedHouse.photo}
                    onChange={(event) => updateHouse(selectedHouse.id, { photo: event.target.value })}
                  />
                </label>
                <label className="full">
                  <span>Tour notes</span>
                  <textarea
                    rows={4}
                    value={selectedHouse.notes}
                    onChange={(event) => updateHouse(selectedHouse.id, { notes: event.target.value })}
                  />
                </label>
              </div>

              <div className="criteria-list">
                {visitFactors.map((factor) => {
                  const Icon = factor.icon;
                  const current = selectedHouse.criteria[factor.id] ?? 0;
                  return (
                    <div className="criterion" key={factor.id}>
                      <div className="criterion-copy">
                        <Icon size={17} />
                        <div>
                          <strong>{factor.label}</strong>
                          <span>{current < 0 ? factor.low : current > 0 ? factor.high : "neutral"}</span>
                        </div>
                      </div>
                      <div className="rating" role="group" aria-label={factor.label}>
                        {[-2, -1, 0, 1, 2].map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={current === value ? "rating-dot active" : "rating-dot"}
                            onClick={() => setCriterion(selectedHouse.id, factor.id, value)}
                            aria-label={`${factor.label} ${value}`}
                          >
                            {value > 0 ? `+${value}` : value}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Home size={28} />
              <h2>No selected home</h2>
            </div>
          )}
        </aside>
      </section>

      <section className="compare-section" aria-label="Comparison table">
        <div className="section-heading">
          <ClipboardCheck size={18} />
          <h2>Compare</h2>
        </div>
        <div className="compare-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Home</th>
                <th>Score</th>
                <th>Family</th>
                <th>Finance</th>
                <th>Price</th>
                <th>Beds</th>
                <th>Baths</th>
                <th>Sq ft</th>
                <th>Commute</th>
                <th>Noise</th>
                <th>Light</th>
                <th>Air</th>
              </tr>
            </thead>
            <tbody>
              {scoredHouses.map(({ house, score }) => (
                <tr key={house.id}>
                  <td>{house.address}</td>
                  <td>{score.total}</td>
                  <td>{score.familyFit}</td>
                  <td>{score.financeFit}</td>
                  <td>{house.price ? money.format(house.price) : "?"}</td>
                  <td>{house.beds ?? "?"}</td>
                  <td>{house.baths ?? "?"}</td>
                  <td>{formatNumber(house.sqft)}</td>
                  <td>{house.commute ? `${house.commute} min` : "?"}</td>
                  <td>{house.criteria.noise ?? 0}</td>
                  <td>{house.criteria.light ?? 0}</td>
                  <td>{house.criteria.smell ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="roadmap-section" aria-label="Connector plan">
        <div className="roadmap-card">
          <RefreshCw size={18} />
          <div>
            <strong>Connector path</strong>
            <p>
              Link and share import works now. Direct listing sync should use approved APIs or partner feeds before replacing manual fields.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
