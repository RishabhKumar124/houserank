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

export type AnalysisConfidence = "low" | "medium" | "high";

export type ResearchSource = {
  title: string;
  url: string;
};

export type AIHouseAnalysis = {
  buyingScore: number;
  investmentScore: number;
  currentValue: number;
  fiveYearLow: number;
  fiveYearMid: number;
  fiveYearHigh: number;
  fiveYearGrowthPct: number;
  confidence: AnalysisConfidence;
  summary: string;
  buyingReasons: string[];
  investmentReasons: string[];
  risks: string[];
  assumptions: string[];
  sources: ResearchSource[];
  analyzedAt: string;
  model: string;
  stale?: boolean;
};

export type ListingEnrichment = {
  draft: Partial<DraftListing>;
  confidence: AnalysisConfidence;
  summary: string;
  missingFields: string[];
  assumptions: string[];
  sources: ResearchSource[];
  enrichedAt: string;
  model: string;
};

export type Destination = {
  name: string;
  minutes: number;
};

export type OfferDetails = {
  offerPrice: number;
  earnestMoney: number;
  contingencies: {
    inspection: boolean;
    financing: boolean;
    appraisal: boolean;
  };
  sellerConcessions: number;
  closingDate: string;
  expirationDate: string;
};

export type House = {
  id: string;
  source: string;
  url: string;
  address: string;
  price?: number;
  propertyTaxRate?: number;
  hoaFees?: number;
  homeownersInsurance?: number;
  estimatedRepairs?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  year?: number;
  commute?: number;
  destinations?: Destination[];
  schoolRating?: number;
  photo: string;
  notes: string;
  status: HouseStatus;
  favorite?: boolean;
  visitedAt?: string;
  criteria: Record<string, number>;
  aiAnalysis?: AIHouseAnalysis;
  offerDetails?: OfferDetails;
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
