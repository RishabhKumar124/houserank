import { Target, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Profile, Suggestion } from "../../../lib/types";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const inputClass = "w-full bg-white border border-zinc-200/60 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 placeholder:text-zinc-400 shadow-sm";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1.5 ml-1";

type ProfileTabProps = {
  profile: Profile;
  updateProfile: (key: keyof Profile, value: string) => void;
  suggestion: Suggestion;
  applySuggestion: () => void;
};

export function ProfileTab({ profile, updateProfile, suggestion, applySuggestion }: ProfileTabProps) {
  const formatMoney = (val: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 w-full space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Buyer Profile</h2>
          <p className="text-sm text-zinc-500 mt-1">Configure your financial snapshot and home preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <label className="block">
            <span className={labelClass}>Location</span>
            <input className={inputClass} value={profile.location} onChange={(e) => updateProfile("location", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Combined Income</span>
            <input className={inputClass} inputMode="numeric" value={profile.income} onChange={(e) => updateProfile("income", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Savings</span>
            <input className={inputClass} inputMode="numeric" value={profile.savings} onChange={(e) => updateProfile("savings", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Stocks</span>
            <input className={inputClass} inputMode="numeric" value={profile.stocks} onChange={(e) => updateProfile("stocks", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Retirement</span>
            <input className={inputClass} inputMode="numeric" value={profile.retirement} onChange={(e) => updateProfile("retirement", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Monthly Debts</span>
            <input className={inputClass} inputMode="numeric" value={profile.monthlyDebt} onChange={(e) => updateProfile("monthlyDebt", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Down Payment (%)</span>
            <input className={inputClass} inputMode="decimal" value={profile.downPaymentPct} onChange={(e) => updateProfile("downPaymentPct", e.target.value)} />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
           <label className="block">
            <span className={labelClass}>Safety Priority</span>
            <select className={inputClass} value={profile.safetyPriority} onChange={(e) => updateProfile("safetyPriority", e.target.value)}>
              <option>Very high</option><option>High</option><option>Normal</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>School Priority</span>
            <select className={inputClass} value={profile.schoolPriority} onChange={(e) => updateProfile("schoolPriority", e.target.value)}>
              <option>Very high</option><option>High</option><option>Normal</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Min Price</span>
            <input className={inputClass} inputMode="numeric" value={profile.minPrice} onChange={(e) => updateProfile("minPrice", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Max Price</span>
            <input className={inputClass} inputMode="numeric" value={profile.maxPrice} onChange={(e) => updateProfile("maxPrice", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Beds</span>
            <input className={inputClass} inputMode="numeric" value={profile.beds} onChange={(e) => updateProfile("beds", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Baths</span>
            <input className={inputClass} inputMode="decimal" value={profile.baths} onChange={(e) => updateProfile("baths", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Max Commute (minutes)</span>
            <input className={inputClass} inputMode="numeric" value={profile.commute} onChange={(e) => updateProfile("commute", e.target.value)} />
          </label>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
          <label className="block">
            <span className={labelClass}>Context & Backstory</span>
            <textarea className={cn(inputClass, "resize-y min-h-[100px]")} value={profile.context} onChange={(e) => updateProfile("context", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Must Haves</span>
            <textarea className={cn(inputClass, "resize-y")} rows={2} value={profile.mustHaves} onChange={(e) => updateProfile("mustHaves", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Dealbreakers</span>
            <textarea className={cn(inputClass, "resize-y")} rows={2} value={profile.dealBreakers} onChange={(e) => updateProfile("dealBreakers", e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Neighborhood Notes</span>
            <textarea className={cn(inputClass, "resize-y")} rows={3} value={profile.neighborhoods} onChange={(e) => updateProfile("neighborhoods", e.target.value)} />
          </label>
        </div>
      </div>

      <aside className="w-full lg:w-[380px] shrink-0 space-y-6 lg:sticky lg:top-24">
        <motion.div whileHover={{ scale: 1.01 }} className="bg-zinc-900 rounded-3xl p-6 text-white shadow-xl shadow-zinc-900/10 border border-zinc-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-1">Suggested from Context</p>
              <h3 className="text-xl font-medium">{suggestion.location}</h3>
            </div>
            <button onClick={applySuggestion} className="flex items-center gap-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30">
              <Target size={14} /> Fill blanks
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
            <div>
              <span className="block text-xs text-zinc-400 mb-0.5">Search band</span>
              <strong className="text-sm font-medium">{formatMoney(suggestion.minPrice)} - {formatMoney(suggestion.maxPrice)}</strong>
            </div>
            <div>
              <span className="block text-xs text-zinc-400 mb-0.5">Stretch cap</span>
              <strong className="text-sm font-medium">{formatMoney(suggestion.stretchPrice)}</strong>
            </div>
            <div>
              <span className="block text-xs text-zinc-400 mb-0.5">Target home</span>
              <strong className="text-sm font-medium">{suggestion.beds}+ bd / {suggestion.baths}+ ba</strong>
            </div>
            <div>
              <span className="block text-xs text-zinc-400 mb-0.5">Cash buffer</span>
              <strong className="text-sm font-medium">{formatMoney(suggestion.cashReserve)}</strong>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed relative z-10">
            {suggestion.rationale[2]} {suggestion.cautions[2]} {suggestion.cautions[0]}
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 relative z-10">Apply fills only blank preference fields. Your explicit choices stay untouched.</p>
        </motion.div>

        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-zinc-900">
            <Calculator size={16} className="text-zinc-400" /> Financial Rationale
          </h3>
          <div className="space-y-4">
            {suggestion.rationale.map((item: string, i: number) => (
              <div key={i} className="flex gap-3 text-sm text-zinc-600">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mt-1.5 shrink-0" />
                <p className="leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </motion.div>
  );
}
