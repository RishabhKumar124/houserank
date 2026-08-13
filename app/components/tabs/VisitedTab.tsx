import { HouseCard } from "../HouseCard";
import { History } from "lucide-react";
import type { HousePanel, ScoredHouse } from "../../../lib/types";

type VisitedTabProps = {
  houses: ScoredHouse[];
  formatMoney: (value?: number) => string;
  openHouse: (id: string, panel?: Exclude<HousePanel, "add" | null>) => void;
  toggleFavorite: (id: string) => void;
  markVisited: (id: string) => void;
  deleteHouse: (id: string) => void;
  selectedId: string;
};

export function VisitedTab({ houses, formatMoney, openHouse, toggleFavorite, markVisited, deleteHouse, selectedId }: VisitedTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Visited Houses</h2>
        <p className="text-sm text-zinc-500 mt-1">What you noticed in person, with your visit score and notes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {houses.map(({ house, score }, index) => (
          <HouseCard 
            key={house.id} house={house} score={score} index={index} 
            formatMoney={formatMoney} openHouse={openHouse} toggleFavorite={toggleFavorite}
            markVisited={markVisited} deleteHouse={deleteHouse} isSelected={house.id === selectedId}
          />
        ))}
        {houses.length === 0 && (
           <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50">
             <div className="w-12 h-12 bg-blue-50 text-blue-500 flex items-center justify-center rounded-2xl mb-4">
               <History size={24} />
             </div>
             <h3 className="text-lg font-medium text-zinc-900">No visits recorded yet</h3>
             <p className="text-sm text-zinc-500 max-w-sm mt-1">Mark a home as visited to unlock the detailed scoring rubric for noise, light, layout, and safety.</p>
           </div>
        )}
      </div>
    </div>
  );
}
