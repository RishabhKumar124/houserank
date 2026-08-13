import {
  ClipboardCheck,
  ExternalLink,
  Plus,
  X,
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
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 sm:text-sm";
const labelClass = "mb-1 block text-xs font-medium text-zinc-600";

type AddHousePanelProps = {
  draft: DraftListing;
  setDraft: Dispatch<SetStateAction<DraftListing>>;
  addListing: () => void;
  setHousePanel: Dispatch<SetStateAction<HousePanel>>;
  inferAddress: (value: string) => string;
  error: string;
  clearError: () => void;
};

export function AddHousePanel({
  draft,
  setDraft,
  addListing,
  setHousePanel,
  inferAddress,
  error,
  clearError,
}: AddHousePanelProps) {
  function update(key: keyof DraftListing, value: string) {
    clearError();
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-50/40">
      <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between border-b border-zinc-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0 pr-4">
          <h2 className="text-lg font-semibold text-zinc-900">Add New Home</h2>
          <p className="text-xs text-zinc-500">Paste a listing link or enter the property manually.</p>
        </div>
        <button type="button" onClick={() => setHousePanel(null)} aria-label="Close add home" className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
          <X size={19} />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 pb-32 sm:px-6 sm:pb-6">
        {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
        <label className="block">
          <span className={labelClass}>Listing link</span>
          <input className={inputClass} type="url" value={draft.url} placeholder="https://www.redfin.com/..." onChange={(event) => {
            const url = event.target.value;
            clearError();
            setDraft((current) => ({ ...current, url, address: current.address || inferAddress(url) }));
          }} />
        </label>
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

      <footer className="absolute inset-x-0 bottom-0 z-10 border-t border-zinc-100 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:p-6">
        <button type="button" onClick={addListing} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 font-medium text-white hover:bg-zinc-800">
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
}: HouseDetailPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-50/40">
      <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between border-b border-zinc-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0 pr-3">
          <h2 className="break-words text-lg font-semibold leading-tight text-zinc-900">{house.address}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-800">Score {score.total}</span>
            <span className="text-xs font-medium text-zinc-500">{score.label}</span>
          </div>
        </div>
        <button type="button" onClick={() => setHousePanel(null)} aria-label="Close home details" className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"><X size={19} /></button>
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 pb-28 sm:px-6 sm:pb-8">
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Score breakdown">
          {[["Profile", score.base], ["Fit", score.familyFit], ["Finance", score.financeFit], ["Visit", `${score.visitDelta >= 0 ? "+" : ""}${score.visitDelta}`]].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-zinc-200 bg-white p-3 text-center">
              <span className="mb-1 block text-[10px] font-semibold uppercase text-zinc-500">{label}</span>
              <strong className="text-lg font-medium text-zinc-900">{value}</strong>
            </div>
          ))}
        </section>

        {score.flags.length ? <div className="flex flex-wrap gap-2">{score.flags.map((flag) => <span key={flag} className="rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-800">{flag}</span>)}</div> : null}

        <section className="grid grid-cols-2 gap-3">
          <label><span className={labelClass}>Status</span><select className={inputClass} value={house.status} onChange={(event) => updateHouse(house.id, { status: event.target.value as HouseStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label><span className={labelClass}>Price</span><input className={inputClass} inputMode="numeric" value={house.price ?? ""} onChange={(event) => updateHouseNumber(house.id, "price", event.target.value)} /></label>
          <label><span className={labelClass}>Beds</span><input className={inputClass} inputMode="decimal" value={house.beds ?? ""} onChange={(event) => updateHouseNumber(house.id, "beds", event.target.value)} /></label>
          <label><span className={labelClass}>Baths</span><input className={inputClass} inputMode="decimal" value={house.baths ?? ""} onChange={(event) => updateHouseNumber(house.id, "baths", event.target.value)} /></label>
          <label><span className={labelClass}>Square feet</span><input className={inputClass} inputMode="numeric" value={house.sqft ?? ""} onChange={(event) => updateHouseNumber(house.id, "sqft", event.target.value)} /></label>
          <label><span className={labelClass}>Year built</span><input className={inputClass} inputMode="numeric" value={house.year ?? ""} onChange={(event) => updateHouseNumber(house.id, "year", event.target.value)} /></label>
          <label className="col-span-2"><span className={labelClass}>Photo URL</span><input className={inputClass} type="url" value={house.photo} onChange={(event) => updateHouse(house.id, { photo: event.target.value })} /></label>
        </section>

        <label className="block"><span className={labelClass}>Notes</span><textarea className={`${inputClass} min-h-32 resize-y`} value={house.notes} onChange={(event) => updateHouse(house.id, { notes: event.target.value })} placeholder="Record observations, questions, and follow-ups..." /></label>

        {house.url ? <a href={house.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800"><ExternalLink size={16} /> Open original listing</a> : null}

        {!isVisitMode ? (
          <button type="button" onClick={() => markVisited(house.id)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-50 font-medium text-blue-700 hover:bg-blue-100"><ClipboardCheck size={18} /> Score This Visit</button>
        ) : (
          <section aria-labelledby="visit-scoring-heading" className="space-y-3">
            <div>
              <h3 id="visit-scoring-heading" className="font-semibold text-zinc-900">In-person visit scoring</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">Choose from -2 (serious concern) to +2 (excellent). Ratings update the total without overriding financial risk.</p>
            </div>
            {visitFactors.map((factor) => {
              const current = house.criteria[factor.id];
              return (
                <fieldset key={factor.id} className="rounded-lg border border-zinc-200 bg-white p-3">
                  <legend className="px-1 text-sm font-semibold text-zinc-900">{factor.label}</legend>
                  <div className="mb-2 flex justify-between gap-3 text-[11px] leading-tight text-zinc-500"><span>{factor.low}</span><span className="text-right">{factor.high}</span></div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[-2, -1, 0, 1, 2].map((value) => (
                      <button key={value} type="button" onClick={() => setCriterion(house.id, factor.id, value)} aria-pressed={current === value} aria-label={`${factor.label}: ${value > 0 ? "+" : ""}${value}`} className={`min-h-11 rounded-lg border text-sm font-semibold ${current === value ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"}`}>{value > 0 ? `+${value}` : value}</button>
                    ))}
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
