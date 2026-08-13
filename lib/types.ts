export type Profile = {
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

export type DraftListing = {
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

export type HouseStatus = "Saved" | "Touring" | "Seen" | "Contender" | "Offer";

export type House = {
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
  favorite?: boolean;
  visitedAt?: string;
  criteria: Record<string, number>;
};

export type AppTab = "recommendations" | "saved" | "visited" | "profile";
export type HousePanel = "add" | "details" | "visit" | null;

export type Score = {
  total: number;
  base: number;
  visitDelta: number;
  financeFit: number;
  familyFit: number;
  label: string;
  flags: string[];
};

export type Suggestion = {
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

export type ScoredHouse = {
  house: House;
  score: Score;
};
