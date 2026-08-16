import { X, Check } from "lucide-react";
import Image from "next/image";
import type { ScoredHouse } from "../../lib/types";

type ComparePanelProps = {
  houses: ScoredHouse[];
  onClose: () => void;
  formatMoney: (val?: number) => string;
};

export function ComparePanel({ houses, onClose, formatMoney }: ComparePanelProps) {
  if (houses.length === 0) return null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white/90 backdrop-blur-3xl text-slate-900 w-full max-w-6xl mx-auto rounded-t-3xl shadow-2xl border border-slate-200 mt-10 relative overflow-hidden">
      <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between border-b border-slate-200 bg-white/50 px-6 py-5 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold">Compare Properties</h2>
          <p className="text-sm text-slate-500 mt-1">Comparing {houses.length} selected homes.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close compare" className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900">
          <X size={20} />
        </button>
      </header>
      
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 min-w-max">
          {/* Row Headers */}
          <div className="flex flex-col gap-4 w-48 shrink-0 font-medium text-slate-500 text-sm mt-[200px]">
            <div className="h-10 flex items-center border-b border-slate-200/50">Price</div>
            <div className="h-10 flex items-center border-b border-slate-200/50">Score</div>
            <div className="h-10 flex items-center border-b border-slate-200/50">Beds / Baths</div>
            <div className="h-10 flex items-center border-b border-slate-200/50">Sqft</div>
            <div className="h-10 flex items-center border-b border-slate-200/50">Commute</div>
            <div className="h-10 flex items-center border-b border-slate-200/50">Property Tax</div>
            <div className="h-10 flex items-center border-b border-slate-200/50">HOA</div>
            <div className="h-10 flex items-center border-b border-slate-200/50">Status</div>
          </div>

          {/* Properties */}
          {houses.map(({ house, score }) => (
            <div key={house.id} className="flex flex-col gap-4 w-64 shrink-0">
              <div className="relative h-40 w-full rounded-xl overflow-hidden shadow-sm mb-2 border border-slate-200">
                <Image src={house.photo} alt={house.address} fill className="object-cover" />
              </div>
              <div className="h-10 flex items-center font-bold text-slate-900 border-b border-slate-200/50">{house.price ? formatMoney(house.price) : "N/A"}</div>
              <div className="h-10 flex items-center font-bold text-fuchsia-600 border-b border-slate-200/50 bg-fuchsia-50/50 px-2 rounded">{score.total}</div>
              <div className="h-10 flex items-center border-b border-slate-200/50">{house.beds} / {house.baths}</div>
              <div className="h-10 flex items-center border-b border-slate-200/50">{house.sqft ? `${house.sqft.toLocaleString()} sqft` : "N/A"}</div>
              <div className="h-10 flex items-center border-b border-slate-200/50">{house.commute ? `${house.commute} min` : "N/A"}</div>
              <div className="h-10 flex items-center border-b border-slate-200/50">{house.propertyTaxRate ? `${house.propertyTaxRate}%` : "N/A"}</div>
              <div className="h-10 flex items-center border-b border-slate-200/50">{house.hoaFees ? formatMoney(house.hoaFees) + '/mo' : "None"}</div>
              <div className="h-10 flex items-center border-b border-slate-200/50">
                <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold">{house.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
