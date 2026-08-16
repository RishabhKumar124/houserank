"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileTab } from "./components/tabs/ProfileTab";
import { RecommendationsTab } from "./components/tabs/RecommendationsTab";
import { SavedTab } from "./components/tabs/SavedTab";
import { VisitedTab } from "./components/tabs/VisitedTab";
import { AddHousePanel, HouseDetailPanel } from "./components/HousePanels";
import { ComparePanel } from "./components/ComparePanel";
import { AssistantPanel } from "./components/AssistantPanel";
import type {
  AIHouseAnalysis,
  AppTab,
  DraftListing,
  House,
  HousePanel,
  HouseStatus,
  ListingEnrichment,
  Profile,
  ResearchSource,
  Score,
  Suggestion,
} from "../lib/types";


import {
  X,
  AlertTriangle,
  Baby,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Download,
  GraduationCap,
  Heart,
  History,
  Home,
  MapPin,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Upload,
  UserRound,
  Utensils,
  Volume2,
  Wind,
} from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type ListingImageAttachment = {
  name: string;
  mimeType: string;
  dataUrl: string;
  size: number;
};

const STORAGE_KEY = "houserank-local-v2";
const APP_VERSION = "5";
const ASSUMED_RATE = 0.067;
const ASSUMED_TAX_INSURANCE_RATE = 0.0135;
const DEFAULT_RESERVE_MONTHS = 6;
const LISTING_IMAGE_TARGET_BYTES = 3_200_000;
const LISTING_IMAGE_MAX_BYTES = 4_000_000;
const LISTING_IMAGE_MAX_WIDTH = 2200;
const LISTING_IMAGE_MAX_HEIGHT = 3200;
const listingImageMimeByExtension: Record<string, string> = {
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const listingImageMimeTypes = new Set(Object.values(listingImageMimeByExtension));

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
    favorite: true,
    visitedAt: "2026-08-09",
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
    favorite: false,
    visitedAt: "2026-08-06",
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
    favorite: true,
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

function dataUrlByteSize(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function mimeTypeFromDataUrl(dataUrl: string) {
  return dataUrl.match(/^data:([^;]+);base64,/i)?.[1]?.toLowerCase() ?? "image/jpeg";
}

function inferListingImageMime(file: File) {
  if (listingImageMimeTypes.has(file.type)) {
    return file.type;
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return listingImageMimeByExtension[extension] ?? "";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the screenshot."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = document.createElement("img");
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not prepare the screenshot."));
    image.src = src;
  });
}

async function compressListingImage(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageElement(objectUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return readFileAsDataUrl(file);

    const scale = Math.min(
      1,
      LISTING_IMAGE_MAX_WIDTH / width,
      LISTING_IMAGE_MAX_HEIGHT / height,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const context = canvas.getContext("2d");
    if (!context) return readFileAsDataUrl(file);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.92, 0.84, 0.76, 0.68, 0.6]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrlByteSize(dataUrl) <= LISTING_IMAGE_TARGET_BYTES || quality === 0.6) {
        return dataUrl;
      }
    }

    return canvas.toDataURL("image/jpeg", 0.6);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function prepareListingImage(file: File): Promise<ListingImageAttachment> {
  const mimeType = inferListingImageMime(file);
  if (!mimeType) {
    throw new Error("Upload a PNG, JPG, WEBP, or GIF listing screenshot.");
  }

  const shouldCompress = file.size > LISTING_IMAGE_TARGET_BYTES && mimeType !== "image/gif";
  const dataUrl = shouldCompress ? await compressListingImage(file) : await readFileAsDataUrl(file);
  const size = dataUrlByteSize(dataUrl);
  if (size > LISTING_IMAGE_MAX_BYTES) {
    throw new Error("Screenshot is too large. Crop to the listing facts and try again.");
  }

  return {
    name: file.name || "Listing screenshot",
    mimeType: mimeTypeFromDataUrl(dataUrl),
    dataUrl,
    size,
  };
}

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
  const byCash = cashAvailableForPurchase / (downPct + 0.035);

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

  const paymentComfortMax = byIncome || 950000;
  const liquidityMax = byCash || paymentComfortMax;
  const recommendedMax = Math.min(paymentComfortMax * 0.9, liquidityMax);
  const safeMax = Math.max(300000, Math.round(recommendedMax / 25000) * 25000);
  const minPrice = Math.max(250000, Math.round((safeMax * 0.72) / 25000) * 25000);
  const stretchPrice = Math.max(
    safeMax + 50000,
    Math.round(Math.min(paymentComfortMax, liquidityMax * 1.05) / 25000) * 25000
  );
  const beds = Math.max(toNumber(profile.beds) ?? 0, hasChild ? 3 : 2);
  const baths = Math.max(toNumber(profile.baths) ?? 0, hasChild ? 2.5 : 2);
  const commute = toNumber(profile.commute) ?? (location.toLowerCase().includes("bellevue") ? 30 : 35);

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
      ? "Children in the household make safety, school path, care logistics, parks, stairs, and sleep noise primary filters."
      : "Your context is treated as an individual buyer profile without assuming children or school needs.",
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
  const visitDelta = Math.round((weighted / (totalWeight * 2)) * 14);
  const boundedBase = clamp(base);
  const boundedFinance = clamp(financeFit);
  const boundedFamily = clamp(familyFit);
  let total = Math.round(
    clamp(boundedBase * 0.55 + boundedFinance * 0.3 + boundedFamily * 0.15 + visitDelta, 0, 98)
  );
  if (boundedFinance < 35) total = Math.min(total, 64);
  else if (boundedFinance < 50) total = Math.min(total, 74);
  else if (flags.includes("finance stretch")) total = Math.min(total, 79);

  return {
    base: Math.round(boundedBase),
    financeFit: Math.round(boundedFinance),
    familyFit: Math.round(boundedFamily),
    visitDelta,
    total,
    label: labelForScore(total),
    flags: [...new Set(flags)].slice(0, 3),
  };
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [houses, setHouses] = useState<House[]>(sampleHouses);
  const [draft, setDraft] = useState<DraftListing>(emptyDraft);
  const [selectedId, setSelectedId] = useState(sampleHouses[0].id);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("recommendations");
  const [housePanel, setHousePanel] = useState<HousePanel>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [saveState, setSaveState] = useState("Saved locally");
  const [hydrated, setHydrated] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [enrichmentState, setEnrichmentState] = useState<{
    status: "idle" | "loading" | "error";
    message: string;
    sources: ResearchSource[];
  }>({ status: "idle", message: "", sources: [] });
  const [listingImage, setListingImage] = useState<ListingImageAttachment | null>(null);
  const [analysisState, setAnalysisState] = useState<{
    status: "idle" | "loading" | "error";
    error: string;
    activeIds: string[];
  }>({ status: "idle", error: "", activeIds: [] });
  const importInputRef = useRef<HTMLInputElement>(null);
  const autoAnalysisStartedRef = useRef(new Set<string>());

  useEffect(() => {
    const cachedVersion = window.localStorage.getItem("houserank-app-version");
    if (cachedVersion !== APP_VERSION && "caches" in window) {
      window.localStorage.setItem("houserank-app-version", APP_VERSION);
      window.caches.keys().then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))));
    }

    const hydrationTimer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as {
            profile?: Profile;
            houses?: House[];
            selectedId?: string;
          };
          if (parsed.profile) setProfile({ ...defaultProfile, ...parsed.profile });
          if (Array.isArray(parsed.houses)) {
            setHouses(parsed.houses);
            setSelectedId(parsed.selectedId ?? parsed.houses[0]?.id ?? "");
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
      setHydrated(true);
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
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profile, houses, selectedId })
    );
  }, [hydrated, profile, houses, selectedId]);

  const scoredHouses = useMemo(
    () => houses.map((house) => ({ house, score: scoreHouse(house, profile) })).sort((a, b) => b.score.total - a.score.total),
    [houses, profile]
  );

  const visibleHouses = useMemo(() => {
    if (activeTab === "saved") return scoredHouses.filter(({ house }) => house.favorite);
    if (activeTab === "visited") return scoredHouses.filter(({ house }) => house.visitedAt);
    return scoredHouses;
  }, [activeTab, scoredHouses]);

  const selectedHouse = houses.find((house) => house.id === selectedId) ?? houses[0];
  const selectedScore = selectedHouse ? scoreHouse(selectedHouse, profile) : null;
  const suggestion = useMemo(() => inferSuggestion(profile), [profile]);

  function updateProfile(key: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
    setHouses((current) => current.map((house) => house.aiAnalysis ? {
      ...house,
      aiAnalysis: { ...house.aiAnalysis, stale: true },
    } : house));
  }

  function applySuggestion() {
    setProfile((current) => ({
      ...current,
      location: current.location.trim() || suggestion.location,
      minPrice: current.minPrice.trim() || String(suggestion.minPrice),
      maxPrice: current.maxPrice.trim() || String(suggestion.maxPrice),
      beds: current.beds.trim() || String(suggestion.beds),
      baths: current.baths.trim() || String(suggestion.baths),
      commute: current.commute.trim() || String(suggestion.commute),
      neighborhoods: current.neighborhoods.trim() || suggestion.neighborhoods,
      mustHaves: current.mustHaves.trim() || suggestion.mustHaves,
      dealBreakers: current.dealBreakers.trim() || suggestion.dealBreakers,
    }));
    setHouses((current) => current.map((house) => house.aiAnalysis ? {
      ...house,
      aiAnalysis: { ...house.aiAnalysis, stale: true },
    } : house));
    setSaveState("Suggestions filled empty fields");
  }

  function updateHouse(id: string, patch: Partial<House>) {
    setHouses((current) =>
      current.map((house) => {
        if (house.id !== id) return house;
        const researchInputsChanged = Object.keys(patch).some((key) => !["favorite", "status", "aiAnalysis"].includes(key));
        return {
          ...house,
          ...patch,
          aiAnalysis: researchInputsChanged && house.aiAnalysis
            ? { ...house.aiAnalysis, stale: true }
            : (patch.aiAnalysis ?? house.aiAnalysis),
        };
      })
    );
  }

  const analyzeHouses = useCallback(async (ids?: string[]) => {
    const targets = houses.filter((house) => house.favorite && (!ids || ids.includes(house.id)));
    if (!targets.length) return;

    const targetIds = targets.map((house) => house.id);
    setAnalysisState({ status: "loading", error: "", activeIds: targetIds });
    setSaveState(targets.length === 1 ? "Deep research running in background" : `${targets.length} deep analyses running in background`);

    async function researchHouse(house: House) {
      const response = await fetch("/api/analyze-houses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          houses: [{
            ...house,
            aiAnalysis: undefined,
            baselineScore: scoreHouse(house, profile),
          }],
        }),
      });
      const body = await response.json() as { analyses?: Array<AIHouseAnalysis & { houseId: string }>; error?: string };
      if (!response.ok || !body.analyses) throw new Error(body.error || "GPT research failed.");

      const next = body.analyses.find((analysis) => analysis.houseId === house.id);
      if (!next) throw new Error(`GPT research did not return a result for ${house.address}.`);
      const aiAnalysis = Object.fromEntries(
        Object.entries(next).filter(([key]) => key !== "houseId"),
      ) as AIHouseAnalysis;
      setHouses((current) => current.map((house) => {
        return house.id === next.houseId ? { ...house, aiAnalysis } : house;
      }));
      setAnalysisState((current) => ({
        ...current,
        activeIds: current.activeIds.filter((id) => id !== house.id),
      }));
    }

    const results = await Promise.allSettled(targets.map(researchHouse));
    const failures = results.filter((result) => result.status === "rejected") as PromiseRejectedResult[];
    const completed = results.length - failures.length;
    if (failures.length) {
      const detail = failures[0].reason instanceof Error ? failures[0].reason.message : "Please retry from Saved Homes.";
      setAnalysisState({ status: "error", error: `${completed} completed, ${failures.length} failed. ${detail}`, activeIds: [] });
      setSaveState("Some GPT analysis needs attention");
      return;
    }

    setAnalysisState({ status: "idle", error: "", activeIds: [] });
    setSaveState(targets.length === 1 ? "GPT analysis updated" : `${targets.length} GPT analyses updated`);
  }, [houses, profile]);

  useEffect(() => {
    if (!hydrated || analysisState.status === "loading") return;
    const pendingIds = houses
      .filter((house) => house.favorite && !house.aiAnalysis && !autoAnalysisStartedRef.current.has(house.id))
      .map((house) => house.id)
      .slice(0, 3);
    if (!pendingIds.length) return;

    pendingIds.forEach((id) => autoAnalysisStartedRef.current.add(id));
    void analyzeHouses(pendingIds);
  }, [analysisState.status, analyzeHouses, houses, hydrated]);

  function updateHouseNumber(id: string, key: keyof House, value: string) {
    updateHouse(id, { [key]: toNumber(value) } as Partial<House>);
  }

  async function attachListingImage(file: File) {
    setDraftError("");
    setEnrichmentState({ status: "loading", message: "Preparing listing screenshot...", sources: [] });
    setSaveState("Preparing listing screenshot");

    try {
      const image = await prepareListingImage(file);
      setListingImage(image);
      setEnrichmentState({
        status: "idle",
        message: `${image.name} ready for AI.`,
        sources: [],
      });
      setSaveState("Listing screenshot attached");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not attach listing screenshot.";
      setListingImage(null);
      setEnrichmentState({ status: "error", message, sources: [] });
      setSaveState("Screenshot needs attention");
    }
  }

  function clearListingImage() {
    setListingImage(null);
    setEnrichmentState((current) => (
      current.message.includes("screenshot") || current.message.includes("Screenshot")
        ? { status: "idle", message: "", sources: [] }
        : current
    ));
    setSaveState("Listing screenshot removed");
  }

  function mergeEnrichedDraft(current: DraftListing, enrichment: ListingEnrichment) {
    const next = { ...current };
    const incoming = enrichment.draft;
    let filled = 0;
    const inferredCurrentAddress = inferAddress(current.url.trim());
    const canReplaceAddress =
      !current.address.trim() ||
      (inferredCurrentAddress && current.address.trim() === inferredCurrentAddress);

    (["address", "price", "beds", "baths", "sqft", "year", "commute", "photo", "notes"] as const)
      .forEach((key) => {
        const value = incoming[key]?.trim();
        if (!value) return;
        const canReplace = key === "address" ? canReplaceAddress : !current[key].trim();
        if (!canReplace) return;
        next[key] = value;
        filled += 1;
      });

    return { draft: next, filled };
  }

  async function enrichListing() {
    const url = draft.url.trim();
    const address = draft.address.trim();
    if (!url && !address && !listingImage) {
      setDraftError("Paste a listing link, attach a screenshot, or add an address first.");
      return;
    }
    if (url && !/^https?:\/\//i.test(url)) {
      setDraftError("Listing links must start with http:// or https://.");
      return;
    }

    setDraftError("");
    setEnrichmentState({
      status: "loading",
      message: listingImage ? "Reading listing screenshot..." : "Looking up public listing details...",
      sources: [],
    });
    setSaveState(listingImage ? "AI screenshot read running" : "AI listing lookup running");

    try {
      const response = await fetch("/api/enrich-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          address,
          profile,
          image: listingImage
            ? {
                name: listingImage.name,
                mimeType: listingImage.mimeType,
                dataUrl: listingImage.dataUrl,
              }
            : undefined,
        }),
      });
      const body = await response.json() as { enrichment?: ListingEnrichment; error?: string };
      if (!response.ok || !body.enrichment) {
        throw new Error(body.error || "AI listing lookup failed.");
      }

      const merged = mergeEnrichedDraft(draft, body.enrichment);
      setDraft(merged.draft);
      const missing = body.enrichment.missingFields.length
        ? ` Missing: ${body.enrichment.missingFields.join(", ")}.`
        : "";
      const filledMessage = merged.filled
        ? `AI filled ${merged.filled} field${merged.filled === 1 ? "" : "s"}. Review before saving.`
        : "AI found details, but your filled fields were left unchanged.";
      setEnrichmentState({
        status: "idle",
        message: `${filledMessage}${missing}`,
        sources: body.enrichment.sources,
      });
      setSaveState(merged.filled ? "AI filled listing details" : "AI lookup completed");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "AI listing lookup failed.";
      setEnrichmentState({ status: "error", message, sources: [] });
      setSaveState("AI listing lookup needs attention");
    }
  }

  function addListing() {
    const url = draft.url.trim();
    const address = draft.address.trim() || inferAddress(url);
    const price = toNumber(draft.price);
    if (!address) {
      setDraftError("Add a property address or a listing link that contains one.");
      return;
    }
    if (!price || price <= 0) {
      setDraftError("Add a valid asking price greater than $0.");
      return;
    }
    if (url && !/^https?:\/\//i.test(url)) {
      setDraftError("Listing links must start with http:// or https://.");
      return;
    }
    setDraftError("");
    const next: House = {
      id: `house-${Date.now()}`,
      source: sourceFromUrl(url),
      url,
      address,
      price,
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
      favorite: true,
      criteria: {},
    };
    setHouses((current) => [next, ...current]);
    setSelectedId(next.id);
    setDraft(emptyDraft);
    setListingImage(null);
    setActiveTab("saved");
    setHousePanel("details");
    setSaveState("Listing added");
  }

  function openHouse(id: string, panel: Exclude<HousePanel, "add" | null> = "details") {
    setSelectedId(id);
    setHousePanel(panel);
  }

  function toggleFavorite(id: string) {
    setHouses((current) => current.map((house) => house.id === id ? { ...house, favorite: !house.favorite } : house));
    setSaveState("Favorites updated");
  }

  function markVisited(id: string) {
    setHouses((current) => current.map((house) => house.id === id ? {
      ...house,
      visitedAt: house.visitedAt || new Date().toISOString().slice(0, 10),
      status: house.status === "Saved" ? "Seen" : house.status,
    } : house));
    setSelectedId(id);
    setActiveTab("visited");
    setHousePanel("visit");
    setSaveState("Visit started");
  }

  function onToggleCompare(id: string) {
    setCompareIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  function deleteHouse(id: string) {
    const house = houses.find((item) => item.id === id);
    if (!house || !window.confirm(`Delete ${house.address}? This cannot be undone.`)) return;
    setHouses((current) => {
      const remaining = current.filter((house) => house.id !== id);
      if (!remaining.some((house) => house.id === selectedId)) {
        setSelectedId(remaining[0]?.id ?? "");
      }
      return remaining;
    });
    setHousePanel(null);
    setSaveState("Home deleted");
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
                aiAnalysis: house.aiAnalysis ? { ...house.aiAnalysis, stale: true } : undefined,
              }
          : house
      )
    );
  }

  async function installApp() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      setSaveState(choice.outcome === "accepted" ? "Install accepted" : "Install dismissed");
      return;
    }
    setSaveState("Use your browser menu, then Add to Home Screen");
  }

  function exportData() {
    const payload = JSON.stringify({ profile, houses }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `houserank-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSaveState("Backup downloaded");
  }

  function isValidBackup(value: unknown): value is { profile: Profile; houses: House[] } {
    if (!value || typeof value !== "object") return false;
    const candidate = value as { profile?: unknown; houses?: unknown };
    if (!candidate.profile || typeof candidate.profile !== "object" || !Array.isArray(candidate.houses)) return false;
    const profileKeys: (keyof Profile)[] = ["location", "income", "savings", "stocks", "retirement", "monthlyDebt", "downPaymentPct", "safetyPriority", "schoolPriority", "minPrice", "maxPrice", "beds", "baths", "commute", "neighborhoods", "mustHaves", "dealBreakers", "context"];
    if (!profileKeys.every((key) => typeof (candidate.profile as Record<string, unknown>)[key] === "string")) return false;
    return candidate.houses.every((house) => {
      if (!house || typeof house !== "object") return false;
      const item = house as Record<string, unknown>;
      return typeof item.id === "string" && typeof item.address === "string" && typeof item.source === "string" && typeof item.notes === "string" && typeof item.criteria === "object";
    });
  }

  function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!isValidBackup(parsed)) throw new Error("Invalid backup schema");
        setProfile(parsed.profile);
        setHouses(parsed.houses);
        setSelectedId(parsed.houses[0]?.id ?? "");
        setHousePanel(null);
        setSaveState(`Imported ${parsed.houses.length} homes`);
      } catch {
        setSaveState("Import failed: choose a HouseRank backup");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  // ===== NEW UI DRIVEN BY FRAMER MOTION & PREMIUM TASTE =====
  return (
    <div className="app-root min-h-screen w-full max-w-full overflow-x-clip bg-[#eef2f8] text-zinc-900 font-sans selection:bg-[#bfe2d7]">
      <header className="sticky top-0 z-40 w-full border-b border-[#cfd7e5] bg-[#fffdf8]/90 backdrop-blur-xl">
        <div className="mobile-header mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 py-2 md:px-6">
          <div className="brand-mobile flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#11756d] text-slate-900 shadow-sm">
              <Home size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-extrabold leading-none text-[#0d5d57]">HouseRank</p>
              <h1 className="truncate text-sm font-medium leading-tight">Home Buying Assistant</h1>
            </div>
          </div>
          <div className="header-actions flex shrink-0 items-center gap-0.5 sm:gap-2">
            <span className="hidden sm:inline-flex items-center text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full mr-2">
              {saveState}
            </span>
            <button onClick={() => setAssistantOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3157b7] text-xs font-bold text-slate-900 shadow-sm transition-colors hover:bg-[#24428d] focus:outline-none focus:ring-2 focus:ring-[#3157b7] focus:ring-offset-2 sm:w-auto sm:gap-2 sm:px-3" aria-label="Open HouseRank AI">
              <Sparkles size={16} /> <span className="hidden sm:inline">Ask AI</span>
            </button>
            <button onClick={installApp} aria-label="Install HouseRank" title="Install HouseRank" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1">
              <Smartphone size={18} />
            </button>
            <button onClick={() => importInputRef.current?.click()} aria-label="Import backup" title="Import backup" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 min-[380px]:flex">
              <Upload size={18} />
            </button>
            <button onClick={exportData} aria-label="Export backup" title="Export backup" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 min-[380px]:flex">
              <Download size={18} />
            </button>
            <input ref={importInputRef} type="file" accept="application/json" onChange={importData} className="hidden" />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pt-2 sm:hidden" aria-live="polite">
        <span className="block w-fit max-w-full truncate rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">{saveState}</span>
      </div>

      <main className="mx-auto w-full max-w-6xl min-w-0 overflow-x-clip px-3 pb-28 pt-5 min-[380px]:px-4 sm:py-8 md:px-6">
        <nav className="mobile-tab-bar mb-8 grid grid-cols-4 gap-1 rounded-2xl border border-slate-300/50 bg-white/50 p-1.5 shadow-sm backdrop-blur-xl" aria-label="HouseRank sections">
          {([
            ["recommendations", Search, "Recommendations", houses.length],
            ["saved", Heart, "Saved", houses.filter((h) => h.favorite).length],
            ["visited", History, "Visited", houses.filter((h) => h.visitedAt).length],
            ["profile", UserRound, "Profile", null],
          ] as const).map(([tab, Icon, label, count]) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setHousePanel(null); }}
                aria-current={isActive ? "page" : undefined}
                className={`relative z-10 flex min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-1 focus:ring-offset-slate-900 ${isActive ? 'text-white' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className={`absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${tab === "saved" ? "bg-fuchsia-600/80" : tab === "visited" ? "bg-cyan-600/80" : tab === "profile" ? "bg-purple-600/80" : "bg-fuchsia-600/80"}`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative flex min-w-0 items-center justify-center gap-2 z-20">
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                  <span className="tab-label tab-label-desktop truncate">{label}</span>
                  <span className="tab-label tab-label-mobile truncate">{tab === "recommendations" ? "Ranked" : label}</span>
                  {count !== null && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/70 text-slate-900 border border-slate-300' : 'bg-white/60 text-slate-600 border border-white/5'}`}>
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="w-full"
          >
            {activeTab === "profile" && <ProfileTab profile={profile} updateProfile={updateProfile} suggestion={suggestion} applySuggestion={applySuggestion} />}
            {activeTab === "recommendations" && <RecommendationsTab houses={scoredHouses} formatMoney={formatMoney} openHouse={openHouse} toggleFavorite={toggleFavorite} markVisited={markVisited} deleteHouse={deleteHouse} setHousePanel={setHousePanel} selectedId={selectedId} compareIds={compareIds} onToggleCompare={onToggleCompare} />}
            {activeTab === "saved" && <SavedTab houses={visibleHouses} formatMoney={formatMoney} openHouse={openHouse} toggleFavorite={toggleFavorite} markVisited={markVisited} deleteHouse={deleteHouse} analyzeHouses={analyzeHouses} analysisState={analysisState} selectedId={selectedId} compareIds={compareIds} onToggleCompare={onToggleCompare} />}
            {activeTab === "visited" && <VisitedTab houses={visibleHouses} formatMoney={formatMoney} openHouse={openHouse} toggleFavorite={toggleFavorite} markVisited={markVisited} deleteHouse={deleteHouse} selectedId={selectedId} />}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {housePanel && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setHousePanel(null)}
                className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: "100%", opacity: 0, scale: 0.95 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                role="dialog"
                aria-modal="true"
                aria-label={housePanel === "add" ? "Add a home" : housePanel === "visit" ? "Visit scoring" : "Home details"}
                className="house-sheet fixed inset-0 w-full bg-white shadow-2xl z-50 overflow-hidden flex flex-col border border-zinc-100 sm:inset-y-4 sm:left-auto sm:right-4 sm:max-w-xl sm:rounded-3xl"
              >
                {housePanel === "add" && <AddHousePanel draft={draft} setDraft={setDraft} addListing={addListing} setHousePanel={setHousePanel} inferAddress={inferAddress} error={draftError} clearError={() => setDraftError("")} enrichListing={enrichListing} enrichmentState={enrichmentState} />}
                {housePanel !== "add" && selectedHouse && selectedScore && (
                  <HouseDetailPanel house={selectedHouse} score={selectedScore} updateHouse={updateHouse} updateHouseNumber={updateHouseNumber} setCriterion={setCriterion} setHousePanel={setHousePanel} markVisited={markVisited} isVisitMode={housePanel === "visit"} visitFactors={visitFactors} statusOptions={statusOptions} profile={profile} />
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {assistantOpen ? (
            <>
              <motion.button
                type="button"
                aria-label="Close AI assistant"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAssistantOpen(false)}
                className="fixed inset-0 z-[60] cursor-default bg-zinc-900/25 backdrop-blur-sm"
              />
              <AssistantPanel profile={profile} houses={scoredHouses} onClose={() => setAssistantOpen(false)} />
            </>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {showCompare && compareIds.length > 0 && (
            <>
              <motion.button
                type="button"
                aria-label="Close Compare"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCompare(false)}
                className="fixed inset-0 z-[60] cursor-default bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed inset-0 z-[70] flex items-end justify-center pointer-events-none"
              >
                <div className="w-full max-h-screen overflow-y-auto pointer-events-auto">
                  <ComparePanel houses={scoredHouses.filter(h => compareIds.includes(h.house.id))} onClose={() => setShowCompare(false)} formatMoney={formatMoney} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {compareIds.length > 0 && !showCompare && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none"
            >
              <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-2 rounded-full shadow-2xl flex items-center gap-3">
                <span className="text-white text-sm font-semibold pl-3">{compareIds.length} selected</span>
                <button
                  onClick={() => setShowCompare(true)}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(192,38,211,0.5)] transition-all"
                >
                  Compare
                </button>
                <button
                  onClick={() => setCompareIds([])}
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
