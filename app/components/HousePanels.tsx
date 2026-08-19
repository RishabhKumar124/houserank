import {
  ClipboardCheck,
  ExternalLink,
  FileImage,
  LoaderCircle,
  Plus,
  Sparkles,
  Trash2,
  X,
  Calculator,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type {
  DraftListing,
  House,
  HousePanel,
  HouseStatus,
  Score,
} from "../../lib/types";

type VisitFactor = {
  id: string;
  label: string;
  low: string;
  high: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-300/50 bg-white/50 px-3 py-2.5 text-base text-slate-900 placeholder-slate-400 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/50 backdrop-blur-md transition-all sm:text-sm";
const labelClass = "mb-1 block text-xs font-medium text-slate-700";

type AddHousePanelProps = {
  draft: DraftListing;
  setDraft: Dispatch<SetStateAction<DraftListing>>;
  addListing: () => void;
  setHousePanel: Dispatch<SetStateAction<HousePanel>>;
  inferAddress: (value: string) => string;
  error: string;
  clearError: () => void;
  enrichListing: () => void;
  enrichmentState: {
    status: "idle" | "loading" | "error";
    message: string;
    sources: Array<{ title: string; url: string }>;
  };
  
};

export function AddHousePanel({
  draft,
  setDraft,
  addListing,
  setHousePanel,
  inferAddress,
  error,
  clearError,
  enrichListing,
  enrichmentState,
  
}: AddHousePanelProps) {
  function update(key: keyof DraftListing, value: string) {
    clearError();
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white/80 backdrop-blur-3xl text-slate-900">
      <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between border-b border-slate-300/50 bg-white/50 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-md">
        <div className="min-w-0 pr-4">
          <h2 className="text-lg font-semibold text-slate-900">Add New Home</h2>
          <p className="text-xs text-slate-500">Paste a listing link, upload a Redfin screenshot, or enter the property manually.</p>
        </div>
        <button type="button" onClick={() => setHousePanel(null)} aria-label="Close add home" className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white/60 hover:text-slate-900">
          <X size={19} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 pb-32 sm:px-6 sm:pb-6">
        {error ? <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/20 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
        <label className="block">
          <span className={labelClass}>Listing link</span>
          <input className={inputClass} type="url" value={draft.url} placeholder="https://www.redfin.com/..." onChange={(event) => {
            const url = event.target.value;
            clearError();
            setDraft((current) => ({ ...current, url, address: current.address || inferAddress(url) }));
          }} />
        </label>
        
        <button
          type="button"
          onClick={enrichListing}
          disabled={enrichmentState.status === "loading"}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#3157b7]/20 bg-[#3157b7] px-4 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[#24428d] disabled:cursor-wait disabled:bg-[#3157b7]/70"
        >
          {enrichmentState.status === "loading" ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />}
          {enrichmentState.status === "loading" ? "Looking Up Details" : "Fill Details with AI"}
        </button>
        {enrichmentState.message ? (
          <div
            aria-live="polite"
            className={`rounded-lg border px-3 py-2 text-sm ${
              enrichmentState.status === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-blue-100 bg-blue-50 text-blue-800"
            }`}
          >
            <p>{enrichmentState.message}</p>
            {enrichmentState.sources.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {enrichmentState.sources.slice(0, 3).map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="rounded-md bg-white/80 px-2 py-1 text-xs font-semibold text-blue-700 underline-offset-2 hover:underline">
                    {source.title}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <label className="block">
          <span className={labelClass}>Address *</span>
          <input className={inputClass} value={draft.address} placeholder="123 Main St, Bellevue, WA" onChange={(event) => update("address", event.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label><span className={labelClass}>Price *</span><input className={inputClass} inputMode="numeric" value={draft.price} placeholder="1500000" onChange={(event) => update("price", event.target.value)} /></label>
          <label><span className={labelClass}>Commute (min)</span><input className={inputClass} inputMode="numeric" value={draft.commute} onChange={(event) => update("commute", event.target.value)} /></label>
          <label><span className={labelClass}>Beds</span><input className={inputClass} inputMode="decimal" value={draft.beds} onChange={(event) => update("beds", event.target.value)} /></label>
          <label><span className={labelClass}>Baths</span><input className={inputClass} inputMode="decimal" value={draft.baths} onChange={(event) => update("baths", event.target.value)} /></label>
          <label><span className={labelClass}>Square feet</span><input className={inputClass} inputMode="numeric" value={draft.sqft} onChange={(event) => update("sqft", event.target.value)} /></label>
          <label><span className={labelClass}>Year built</span><input className={inputClass} inputMode="numeric" value={draft.year} onChange={(event) => update("year", event.target.value)} /></label>
        </div>

        <label className="block"><span className={labelClass}>Photo URL</span><input className={inputClass} type="url" value={draft.photo} onChange={(event) => update("photo", event.target.value)} /></label>
        <label className="block"><span className={labelClass}>Initial notes</span><textarea className={`${inputClass} min-h-24 resize-y`} value={draft.notes} onChange={(event) => update("notes", event.target.value)} /></label>
      </div>

      <footer className="absolute inset-x-0 bottom-0 z-10 border-t border-slate-300/50 bg-white/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:p-6 backdrop-blur-xl">
        <button type="button" onClick={addListing} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 font-semibold text-white shadow-[0_0_20px_rgba(192,38,211,0.5)] transition-all hover:shadow-[0_0_30px_rgba(192,38,211,0.8)] focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-slate-900">
          <Plus size={18} /> Add Home to Tracker
        </button>
      </footer>
    </div>
  );
}

type HouseDetailPanelProps = {
  house: House;
  score: Score;
  updateHouse: (id: string, patch: Partial<House>) => void;
  updateHouseNumber: (id: string, key: keyof House, value: string) => void;
  setCriterion: (id: string, criterionId: string, value: number) => void;
  setHousePanel: Dispatch<SetStateAction<HousePanel>>;
  markVisited: (id: string) => void;
  isVisitMode: boolean;
  visitFactors: readonly VisitFactor[];
  statusOptions: HouseStatus[];
};

export function HouseDetailPanel({
  house,
  score,
  updateHouse,
  updateHouseNumber,
  setCriterion,
  setHousePanel,
  markVisited,
  isVisitMode,
  visitFactors,
  statusOptions,
  profile,
}: HouseDetailPanelProps & { profile?: any }) {
  const calculatePITI = () => {
    if (!house.price || !profile) return 0;
    const downPayment = house.price * (profile.downPaymentPct / 100);
    const principal = house.price - downPayment;
    const r = profile.interestRate / 100 / 12;
    const n = 360;
    const mortgage = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const tax = (house.price * ((house.propertyTaxRate || 1.2) / 100)) / 12;
    const ins = (house.homeownersInsurance || 1500) / 12;
    const hoa = house.hoaFees || 0;
    return mortgage + tax + ins + hoa;
  };
  const piti = calculatePITI();

  return (
    <div className="flex h-full min-h-0 flex-col bg-white/80 backdrop-blur-3xl text-slate-900">
      <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between border-b border-slate-300/50 bg-white/50 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-md">
        <div className="min-w-0 pr-3">
          <h2 className="break-words text-lg font-semibold leading-tight text-slate-900">{house.address}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-gradient-to-r from-fuchsia-600 to-purple-600 px-2 py-1 text-xs font-bold text-white shadow-[0_0_10px_rgba(192,38,211,0.5)]">Score {score.total}</span>
            <span className="text-xs font-medium text-slate-700">{score.label}</span>
          </div>
        </div>
        <button type="button" onClick={() => setHousePanel(null)} aria-label="Close home details" className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white/60 hover:text-slate-900"><X size={19} /></button>
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 pb-28 sm:px-6 sm:pb-8">
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Score breakdown">
          {[["Profile", score.base], ["Fit", score.familyFit], ["Finance", score.financeFit], ["Visit", `${score.visitDelta >= 0 ? "+" : ""}${score.visitDelta}`]].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-300/50 bg-white/50 p-3 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">{label}</span>
              <strong className="text-lg font-bold text-slate-900">{value}</strong>
            </div>
          ))}
        </section>

        {score.flags.length ? <div className="flex flex-wrap gap-2">{score.flags.map((flag) => <span key={flag} className="rounded-md border border-rose-500/30 bg-rose-500/20 px-2 py-1 text-xs font-semibold text-rose-300">{flag}</span>)}</div> : null}

        {piti > 0 && (
          <section className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator size={16} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-cyan-400">PITI+H Estimate</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">${Math.round(piti).toLocaleString()}</span>
              <span className="text-xs text-cyan-200/70">/ month</span>
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3">
          <label><span className={labelClass}>Status</span><select className={inputClass} value={house.status} onChange={(event) => updateHouse(house.id, { status: event.target.value as HouseStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label><span className={labelClass}>Price</span><input className={inputClass} inputMode="numeric" value={house.price ?? ""} onChange={(event) => updateHouseNumber(house.id, "price", event.target.value)} /></label>
          <label><span className={labelClass}>Tax Rate (%)</span><input className={inputClass} inputMode="decimal" value={house.propertyTaxRate ?? ""} placeholder="1.2" onChange={(event) => updateHouseNumber(house.id, "propertyTaxRate", event.target.value)} /></label>
          <label><span className={labelClass}>HOA (/mo)</span><input className={inputClass} inputMode="numeric" value={house.hoaFees ?? ""} placeholder="0" onChange={(event) => updateHouseNumber(house.id, "hoaFees", event.target.value)} /></label>
          <label><span className={labelClass}>Insurance (/yr)</span><input className={inputClass} inputMode="numeric" value={house.homeownersInsurance ?? ""} placeholder="1500" onChange={(event) => updateHouseNumber(house.id, "homeownersInsurance", event.target.value)} /></label>
          <label><span className={labelClass}>Est. Repairs</span><input className={inputClass} inputMode="numeric" value={house.estimatedRepairs ?? ""} placeholder="0" onChange={(event) => updateHouseNumber(house.id, "estimatedRepairs", event.target.value)} /></label>
          <label><span className={labelClass}>Beds</span><input className={inputClass} inputMode="decimal" value={house.beds ?? ""} onChange={(event) => updateHouseNumber(house.id, "beds", event.target.value)} /></label>
          <label><span className={labelClass}>Baths</span><input className={inputClass} inputMode="decimal" value={house.baths ?? ""} onChange={(event) => updateHouseNumber(house.id, "baths", event.target.value)} /></label>
          <label><span className={labelClass}>Square feet</span><input className={inputClass} inputMode="numeric" value={house.sqft ?? ""} onChange={(event) => updateHouseNumber(house.id, "sqft", event.target.value)} /></label>
          <label><span className={labelClass}>Year built</span><input className={inputClass} inputMode="numeric" value={house.year ?? ""} onChange={(event) => updateHouseNumber(house.id, "year", event.target.value)} /></label>
          <label className="col-span-2"><span className={labelClass}>Photo URL</span><input className={inputClass} type="url" value={house.photo} onChange={(event) => updateHouse(house.id, { photo: event.target.value })} /></label>
        </section>

        {house.status === "Offer" && (
          <section className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-fuchsia-400">Offer Strategy Tracker</h3>
            <div className="grid grid-cols-2 gap-3">
              <label><span className={labelClass}>Offer Price</span><input className={inputClass} inputMode="numeric" value={house.offerDetails?.offerPrice ?? ""} onChange={(e) => updateHouse(house.id, { offerDetails: { ...(house.offerDetails || { earnestMoney: 0, sellerConcessions: 0, closingDate: "", expirationDate: "", contingencies: { inspection: false, financing: false, appraisal: false } }), offerPrice: e.target.value ? Number(e.target.value) : 0 } })} /></label>
              <label><span className={labelClass}>Expiration</span><input type="date" className={inputClass} value={house.offerDetails?.expirationDate ?? ""} onChange={(e) => updateHouse(house.id, { offerDetails: { ...(house.offerDetails || { offerPrice: 0, earnestMoney: 0, sellerConcessions: 0, closingDate: "", contingencies: { inspection: false, financing: false, appraisal: false } }), expirationDate: e.target.value } })} /></label>
              <label><span className={labelClass}>Earnest Money</span><input className={inputClass} inputMode="numeric" value={house.offerDetails?.earnestMoney ?? ""} onChange={(e) => updateHouse(house.id, { offerDetails: { ...(house.offerDetails || { offerPrice: 0, sellerConcessions: 0, closingDate: "", expirationDate: "", contingencies: { inspection: false, financing: false, appraisal: false } }), earnestMoney: e.target.value ? Number(e.target.value) : 0 } })} /></label>
              <label><span className={labelClass}>Closing Date</span><input type="date" className={inputClass} value={house.offerDetails?.closingDate ?? ""} onChange={(e) => updateHouse(house.id, { offerDetails: { ...(house.offerDetails || { offerPrice: 0, earnestMoney: 0, sellerConcessions: 0, expirationDate: "", contingencies: { inspection: false, financing: false, appraisal: false } }), closingDate: e.target.value } })} /></label>
            </div>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={house.offerDetails?.contingencies?.inspection ?? false} onChange={(e) => updateHouse(house.id, { offerDetails: { ...(house.offerDetails as any), contingencies: { ...(house.offerDetails?.contingencies as any), inspection: e.target.checked } } })} className="rounded border-slate-300 bg-white/60 text-fuchsia-500 focus:ring-fuchsia-500" /><span className="text-sm text-slate-700">Inspection</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={house.offerDetails?.contingencies?.financing ?? false} onChange={(e) => updateHouse(house.id, { offerDetails: { ...(house.offerDetails as any), contingencies: { ...(house.offerDetails?.contingencies as any), financing: e.target.checked } } })} className="rounded border-slate-300 bg-white/60 text-fuchsia-500 focus:ring-fuchsia-500" /><span className="text-sm text-slate-700">Financing</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={house.offerDetails?.contingencies?.appraisal ?? false} onChange={(e) => updateHouse(house.id, { offerDetails: { ...(house.offerDetails as any), contingencies: { ...(house.offerDetails?.contingencies as any), appraisal: e.target.checked } } })} className="rounded border-slate-300 bg-white/60 text-fuchsia-500 focus:ring-fuchsia-500" /><span className="text-sm text-slate-700">Appraisal</span></label>
            </div>
          </section>
        )}

        <label className="block"><span className={labelClass}>Notes</span><textarea className={`${inputClass} min-h-32 resize-y`} value={house.notes} onChange={(event) => updateHouse(house.id, { notes: event.target.value })} placeholder="Record observations, questions, and follow-ups..." /></label>

        {house.url ? <a href={house.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white/50 px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-white/60 hover:border-white/40"><ExternalLink size={16} /> Open original listing</a> : null}

        {!isVisitMode ? (
          <button type="button" onClick={() => markVisited(house.id)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/20 font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30 hover:text-cyan-200"><ClipboardCheck size={18} /> Score This Visit</button>
        ) : (
          <section aria-labelledby="visit-scoring-heading" className="space-y-3">
            <div>
              <h3 id="visit-scoring-heading" className="font-semibold text-slate-900">In-person visit scoring</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Choose from -2 (serious concern) to +2 (excellent). Ratings update the total without overriding financial risk.</p>
            </div>
            {visitFactors.map((factor) => {
              const current = house.criteria[factor.id];
              return (
                <fieldset key={factor.id} className="rounded-lg border border-slate-300/50 bg-white/50 p-3">
                  <legend className="px-1 text-sm font-semibold text-slate-900">{factor.label}</legend>
                  <div className="mb-2 flex justify-between gap-3 text-[11px] leading-tight text-slate-500"><span>{factor.low}</span><span className="text-right">{factor.high}</span></div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[-2, -1, 0, 1, 2].map((value) => {
                       let colorClass = "border-slate-300/50 bg-white/50 text-slate-500 hover:border-slate-400";
                       if (current === value) {
                         if (value === -2) colorClass = "border-rose-600 bg-rose-600 text-slate-900 shadow-[0_0_15px_rgba(225,29,72,0.5)]";
                         else if (value === -1) colorClass = "border-orange-500 bg-orange-500 text-slate-900 shadow-[0_0_15px_rgba(249,115,22,0.5)]";
                         else if (value === 0) colorClass = "border-zinc-500 bg-zinc-500 text-slate-900 shadow-[0_0_15px_rgba(113,113,122,0.5)]";
                         else if (value === 1) colorClass = "border-emerald-500 bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)]";
                         else if (value === 2) colorClass = "border-cyan-500 bg-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.5)]";
                       }
                       return (
                         <button key={value} type="button" onClick={() => setCriterion(house.id, factor.id, value)} aria-pressed={current === value} aria-label={`${factor.label}: ${value > 0 ? "+" : ""}${value}`} className={`min-h-11 rounded-lg border text-sm font-bold transition-all ${colorClass}`}>{value > 0 ? `+${value}` : value}</button>
                       );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
