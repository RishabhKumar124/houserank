import { HouseCard } from "../HouseCard";
import { Plus } from "lucide-react";
import type { HousePanel, ScoredHouse } from "../../../lib/types";

type HouseListProps = {
  houses: ScoredHouse[];
  formatMoney: (value?: number) => string;
  openHouse: (id: string, panel?: Exclude<HousePanel, "add" | null>) => void;
  toggleFavorite: (id: string) => void;
  markVisited: (id: string) => void;
  deleteHouse: (id: string) => void;
  setHousePanel: (panel: HousePanel) => void;
  selectedId: string;
};

export function RecommendationsTab({ houses, formatMoney, openHouse, toggleFavorite, markVisited, deleteHouse, setHousePanel, selectedId }: HouseListProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">House Recommendations</h2>
          <p className="text-sm text-zinc-500 mt-1">Every home ranked against your budget, safety, and buyer priorities.</p>
        </div>
        <button onClick={() => setHousePanel("add")} className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2">
          <Plus size={18} /> Add Home
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {houses.map(({ house, score }, index) => (
          <HouseCard 
            key={house.id} 
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
        ))}
        {houses.length === 0 && (
           <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50">
             <div className="w-12 h-12 bg-zinc-100 text-zinc-400 flex items-center justify-center rounded-2xl mb-4">
               <Plus size={24} />
             </div>
             <h3 className="text-lg font-medium text-zinc-900">No homes added yet</h3>
             <p className="text-sm text-zinc-500 max-w-sm mt-1">Add a Zillow or Redfin link to start tracking and ranking homes automatically.</p>
           </div>
        )}
      </div>
    </div>
  );
}
