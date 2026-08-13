import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleAlert,
  ExternalLink,
  Heart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { HouseCard } from "../HouseCard";
import type { HousePanel, ScoredHouse } from "../../../lib/types";

type SortMode = "buying" | "investment" | "growth" | "baseline";

type AnalysisState = {
  status: "idle" | "loading" | "error";
  error: string;
  activeIds: string[];
};

type SavedTabProps = {
  houses: ScoredHouse[];
  formatMoney: (value?: number) => string;
  openHouse: (id: string, panel?: Exclude<HousePanel, "add" | null>) => void;
  toggleFavorite: (id: string) => void;
  markVisited: (id: string) => void;
  deleteHouse: (id: string) => void;
  analyzeHouses: (ids?: string[]) => Promise<void>;
  analysisState: AnalysisState;
  selectedId: string;
};

const sortLabels: Record<SortMode, string> = {
  buying: "GPT buying score",
  investment: "Investment score",
  growth: "5-year growth",
  baseline: "Baseline score",
};

function confidenceClass(confidence: "low" | "medium" | "high") {
  if (confidence === "high") return "bg-emerald-100 text-emerald-800";
  if (confidence === "medium") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

export function SavedTab({
  houses,
  formatMoney,
  openHouse,
  toggleFavorite,
  markVisited,
  deleteHouse,
  analyzeHouses,
  analysisState,
  selectedId,
}: SavedTabProps) {
  const [sortMode, setSortMode] = useState<SortMode>("buying");
  const analyzedCount = houses.filter(({ house }) => house.aiAnalysis).length;
  const isLoading = analysisState.status === "loading";
  const sortedHouses = useMemo(() => [...houses].sort((left, right) => {
    const leftAnalysis = left.house.aiAnalysis;
    const rightAnalysis = right.house.aiAnalysis;
    const missingOrder = Number(Boolean(rightAnalysis)) - Number(Boolean(leftAnalysis));
    if (missingOrder) return missingOrder;
    if (sortMode === "buying") return (rightAnalysis?.buyingScore ?? -1) - (leftAnalysis?.buyingScore ?? -1);
    if (sortMode === "investment") return (rightAnalysis?.investmentScore ?? -1) - (leftAnalysis?.investmentScore ?? -1);
    if (sortMode === "growth") return (rightAnalysis?.fiveYearGrowthPct ?? -999) - (leftAnalysis?.fiveYearGrowthPct ?? -999);
    return right.score.total - left.score.total;
  }), [houses, sortMode]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="overflow-hidden rounded-lg border border-[#bedbd5] bg-[#e6f5f1] shadow-sm">
        <div className="grid gap-5 px-4 py-5 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase text-[#0d5d57]">
              <BrainCircuit size={16} /> Research lab
            </div>
            <h2 className="text-2xl font-semibold text-zinc-950">Saved Homes</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-700">
              Compare personal fit with risk-adjusted investment potential and a researched five-year value range.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void analyzeHouses()}
            disabled={isLoading || houses.length === 0}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#11756d] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0d5d57] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {isLoading ? "Deep research running..." : analyzedCount ? "Refresh GPT analysis" : "Start deep analysis"}
          </button>
        </div>
        <div className="grid grid-cols-1 border-t border-[#bedbd5] bg-white/55 sm:grid-cols-3">
          <div className="flex items-center gap-3 border-b border-[#bedbd5] px-4 py-3 sm:border-b-0 sm:border-r">
            <ShieldCheck size={18} className="text-[#11756d]" />
            <span className="text-xs font-bold text-zinc-700">Personal fit + affordability</span>
          </div>
          <div className="flex items-center gap-3 border-b border-[#bedbd5] px-4 py-3 sm:border-b-0 sm:border-r">
            <TrendingUp size={18} className="text-[#b77b18]" />
            <span className="text-xs font-bold text-zinc-700">Risk-adjusted investment quality</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <ChartNoAxesCombined size={18} className="text-[#3157b7]" />
            <span className="text-xs font-bold text-zinc-700">Low / midpoint / high forecast</span>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-600">
          <strong className="text-zinc-950">{houses.length}</strong> saved · <strong className="text-zinc-950">{analyzedCount}</strong> analyzed
        </div>
        <label className="flex min-w-0 items-center gap-2 text-xs font-bold text-zinc-600 sm:w-auto">
          <ArrowUpDown size={16} className="shrink-0 text-[#3157b7]" />
          <span className="shrink-0">Sort by</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="min-h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 outline-none focus:border-[#3157b7] focus:ring-2 focus:ring-blue-100 sm:w-52"
            aria-label="Sort saved homes"
          >
            {Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {analysisState.status === "error" ? (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <CircleAlert className="mt-0.5 shrink-0" size={18} />
          <span>{analysisState.error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sortedHouses.map(({ house, score }, index) => {
          const analysis = house.aiAnalysis;
          const refreshing = isLoading && analysisState.activeIds.includes(house.id);
          return (
            <div key={house.id} className="min-w-0 space-y-3">
              <HouseCard
                house={house}
                score={score}
                index={index}
                formatMoney={formatMoney}
                openHouse={openHouse}
                toggleFavorite={toggleFavorite}
                markVisited={markVisited}
                deleteHouse={deleteHouse}
                isSelected={house.id === selectedId}
              />

              {analysis ? (
                <article className="overflow-hidden rounded-lg border border-zinc-200 bg-[#fffdf8] shadow-sm" aria-label={`GPT research for ${house.address}`}>
                  <div className="grid grid-cols-2 border-b border-zinc-200 sm:grid-cols-3">
                    <div className="bg-[#dff3ee] px-3 py-4 text-center">
                      <span className="block text-[10px] font-extrabold uppercase text-[#0d5d57]">Buying score</span>
                      <strong className="mt-1 block text-3xl leading-none text-[#0d5d57]">{analysis.buyingScore}</strong>
                      <span className="text-[10px] font-bold text-[#0d5d57]">personal fit</span>
                    </div>
                    <div className="bg-[#fff0cf] px-3 py-4 text-center">
                      <span className="block text-[10px] font-extrabold uppercase text-[#8a580d]">Investment</span>
                      <strong className="mt-1 block text-3xl leading-none text-[#8a580d]">{analysis.investmentScore}</strong>
                      <span className="text-[10px] font-bold text-[#8a580d]">risk adjusted</span>
                    </div>
                    <div className="col-span-2 bg-[#e6edff] px-3 py-4 text-center sm:col-span-1">
                      <span className="block text-[10px] font-extrabold uppercase text-[#3157b7]">5-year gain</span>
                      <strong className="mt-1 block text-3xl leading-none text-[#3157b7]">{analysis.fiveYearGrowthPct >= 0 ? "+" : ""}{analysis.fiveYearGrowthPct}%</strong>
                      <span className="text-[10px] font-bold text-[#3157b7]">midpoint estimate</span>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-bold text-zinc-950">5-year value: {formatMoney(analysis.fiveYearMid)}</div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase ${confidenceClass(analysis.confidence)}`}>{analysis.confidence} confidence</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[["Low", analysis.fiveYearLow], ["Mid", analysis.fiveYearMid], ["High", analysis.fiveYearHigh]].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-zinc-200 bg-white px-2 py-2">
                          <span className="block text-[10px] font-bold uppercase text-zinc-500">{label}</span>
                          <strong className="block break-words text-xs text-zinc-900 sm:text-sm">{formatMoney(Number(value))}</strong>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-700">{analysis.summary}</p>

                    <details className="group rounded-lg border border-zinc-200 bg-white">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-bold text-zinc-900">
                        <span>Evidence, risks & assumptions</span>
                        <span className="text-[#3157b7] group-open:rotate-45">+</span>
                      </summary>
                      <div className="space-y-4 border-t border-zinc-100 px-3 py-4 text-xs leading-relaxed text-zinc-700">
                        <div>
                          <strong className="mb-1 block text-[#0d5d57]">Why it fits</strong>
                          {analysis.buyingReasons.map((reason, index) => <p key={`${index}-${reason}`}>• {reason}</p>)}
                        </div>
                        <div>
                          <strong className="mb-1 block text-[#8a580d]">Investment case</strong>
                          {analysis.investmentReasons.map((reason, index) => <p key={`${index}-${reason}`}>• {reason}</p>)}
                        </div>
                        {analysis.risks.length ? <div><strong className="mb-1 block text-rose-700">Risks</strong>{analysis.risks.map((risk, index) => <p key={`${index}-${risk}`}>• {risk}</p>)}</div> : null}
                        {analysis.assumptions.length ? <div><strong className="mb-1 block text-zinc-800">Assumptions</strong>{analysis.assumptions.map((assumption, index) => <p key={`${index}-${assumption}`}>• {assumption}</p>)}</div> : null}
                        <div>
                          <strong className="mb-2 block text-[#3157b7]">Web sources</strong>
                          <div className="flex flex-wrap gap-2">
                            {analysis.sources.length ? analysis.sources.map((source) => (
                              <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 rounded-md bg-blue-50 px-2 py-1 font-bold text-[#3157b7] hover:bg-blue-100">
                                <ExternalLink size={12} className="shrink-0" /> <span className="truncate">{source.title}</span>
                              </a>
                            )) : <span>No source links were returned. Treat this result as low confidence.</span>}
                          </div>
                        </div>
                      </div>
                    </details>

                    <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                      <span>{analysis.stale ? "Profile or home details changed since this analysis." : `Researched ${new Date(analysis.analyzedAt).toLocaleDateString()}`}</span>
                      <button
                        type="button"
                        onClick={() => void analyzeHouses([house.id])}
                        disabled={isLoading}
                        title={`Refresh GPT research for ${house.address}`}
                        className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 font-bold ${analysis.stale ? "bg-rose-100 text-rose-800" : "bg-zinc-100 text-zinc-700"}`}
                      >
                        <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> {analysis.stale ? "Refresh stale score" : "Refresh"}
                      </button>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="flex flex-col gap-3 rounded-lg border border-dashed border-[#b9c8e9] bg-[#f2f5ff] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <strong className="text-sm text-[#24428d]">{refreshing ? "Deep research is running" : "Waiting for GPT research"}</strong>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600">{refreshing ? "You can keep using HouseRank. This result will appear automatically." : "Saved homes start deep analysis automatically when the app is open."}</p>
                  </div>
                  <button type="button" disabled={isLoading} onClick={() => void analyzeHouses([house.id])} className="flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#3157b7] px-3 text-xs font-bold text-white disabled:opacity-60">
                    {refreshing ? <RefreshCw className="animate-spin" size={15} /> : <Sparkles size={15} />} {refreshing ? "Running" : "Retry"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {houses.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-white/70 py-20 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-rose-500"><Heart size={24} /></div>
            <h3 className="text-lg font-medium text-zinc-900">No saved homes</h3>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">Click the heart icon on any recommendation to save it here.</p>
          </div>
        )}
      </div>

      {houses.length ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
          Forecasts are planning estimates, not appraisals or guarantees. Verify property facts, school assignment, insurance, taxes, HOA, condition, and financing before making an offer.
        </p>
      ) : null}
    </div>
  );
}
