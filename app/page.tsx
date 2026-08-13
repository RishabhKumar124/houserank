"use client";

import {
  AlertTriangle,
  Baby,
  Bath,
  BedDouble,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Download,
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
  Trash2,
  Upload,
  Utensils,
  Volume2,
  Wind,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Profile = {
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
  label: string;
  flags: string[];
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "houserank-local-v1";

const defaultProfile: Profile = {
  minPrice: "650000",
  maxPrice: "950000",
  beds: "3",
  baths: "2",
  commute: "35",
  neighborhoods: "Good schools, parks, Indian grocery within 20 minutes",
  mustHaves: "Quiet bedrooms, good ventilation, storage, safe stairs",
  dealBreakers: "Water damage, heavy road noise, poor kitchen exhaust",
  context:
    "Indian family with a baby girl. We cook often, care about quiet sleep, safe stairs, parks, daycare, schools, and nearby Indian groceries or community.",
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
    address: "1488 Willow Bend Dr",
    price: 835000,
    beds: 4,
    baths: 2.5,
    sqft: 2180,
    year: 1998,
    commute: 28,
    photo:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
    notes:
      "Quiet cul-de-sac, pantry, parks nearby, newer HVAC. Check kitchen exhaust and stairs gate fit.",
    status: "Contender",
    criteria: sampleCriteria,
  },
  {
    id: "sample-2",
    source: "Redfin",
    url: "https://www.redfin.com/",
    address: "72 Maple Ridge Ct",
    price: 910000,
    beds: 3,
    baths: 2,
    sqft: 1840,
    year: 1987,
    commute: 38,
    photo:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=80",
    notes:
      "Great natural light and mature trees. Some road noise from the back deck during rush hour.",
    status: "Seen",
    criteria: { noise: -1, light: 2, layout: 1, exterior: 1, storage: 0 },
  },
  {
    id: "sample-3",
    source: "Realtor",
    url: "https://www.realtor.com/",
    address: "309 Cedar Garden Ln",
    price: 760000,
    beds: 3,
    baths: 2,
    sqft: 1660,
    year: 2006,
    commute: 31,
    photo:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    notes:
      "Lower price, clean inspection notes, small yard, strong storage. Need to verify daycare route.",
    status: "Touring",
    criteria: { noise: 1, light: 1, smell: 2, storage: 2, outdoor: -1 },
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
    label: "Baby safety",
    icon: Baby,
    weight: 1.25,
    low: "open stairs, hazards, blind spots",
    high: "safe stairs, visible play zones",
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
    icon: Baby,
    weight: 1.0,
    low: "weak routes or few options",
    high: "daycare, schools, parks fit",
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
    weight: 0.85,
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

function scoreHouse(house: House, profile: Profile): Score {
  const flags: string[] = [];
  const maxPrice = toNumber(profile.maxPrice);
  const minPrice = toNumber(profile.minPrice);
  const targetBeds = toNumber(profile.beds);
  const targetBaths = toNumber(profile.baths);
  const targetCommute = toNumber(profile.commute);
  let base = 62;

  if (house.price && maxPrice) {
    if (house.price <= maxPrice) {
      base += 8;
    } else {
      const over = (house.price - maxPrice) / maxPrice;
      base -= over > 0.1 ? 18 : over > 0.05 ? 10 : 5;
      flags.push("over budget");
    }
  }

  if (house.price && minPrice && house.price < minPrice * 0.82) {
    base -= 3;
    flags.push("verify pricing");
  }

  if (targetBeds && house.beds) {
    base += house.beds >= targetBeds ? 8 : -Math.min(18, (targetBeds - house.beds) * 9);
    if (house.beds < targetBeds) flags.push("bedroom gap");
  }

  if (targetBaths && house.baths) {
    base += house.baths >= targetBaths ? 6 : -Math.min(12, (targetBaths - house.baths) * 8);
    if (house.baths < targetBaths) flags.push("bath gap");
  }

  if (targetCommute && house.commute) {
    if (house.commute <= targetCommute) {
      base += 7;
    } else if (house.commute <= targetCommute + 10) {
      base -= 2;
      flags.push("commute stretch");
    } else {
      base -= 10;
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
    base += safety > 0 ? 3 : safety < 0 ? -5 : 0;
    base += noise > 0 ? 3 : noise < 0 ? -5 : 0;
  }
  if (context.includes("indian") || context.includes("cook")) {
    const kitchen = house.criteria.kitchen ?? 0;
    const community = house.criteria.community ?? 0;
    base += kitchen > 0 ? 3 : kitchen < 0 ? -4 : 0;
    base += community > 0 ? 2 : 0;
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

  function updateProfile(key: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
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
          <Search size={18} />
          <span>{houses.length} homes tracked</span>
        </div>
        <div className="summary-stat">
          <ClipboardCheck size={18} />
          <span>{houses.filter((house) => house.status === "Seen").length} visited</span>
        </div>
        <div className="summary-stat">
          <Star size={18} />
          <span>{houses.filter((house) => house.status === "Contender").length} contenders</span>
        </div>
      </section>

      <section className="workspace">
        <aside className="profile-panel" aria-label="Buyer profile">
          <div className="section-heading">
            <SlidersHorizontal size={18} />
            <h2>Profile</h2>
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
