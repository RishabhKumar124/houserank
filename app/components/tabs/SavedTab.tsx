import { HouseCard } from "../HouseCard";
import { Heart } from "lucide-react";
import type { HousePanel, ScoredHouse } from "../../../lib/types";

type SavedTabProps = {
  houses: ScoredHouse[];
  formatMoney: (value?: number) => string;
  openHouse: (id: string, panel?: Exclude<HousePanel, "add" | null>) => void;
  toggleFavorite: (id: string) => void;
  markVisited: (id: string) => void;
  deleteHouse: (id: string) => void;
  selectedId: string;
};

export function SavedTab({ houses, formatMoney, openHouse, toggleFavorite, markVisited, deleteHouse, selectedId }: SavedTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Saved Favorites</h2>
        <p className="text-sm text-zinc-500 mt-1">The homes worth keeping close as your search narrows.</p>
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
             <div className="w-12 h-12 bg-rose-50 text-rose-500 flex items-center justify-center rounded-2xl mb-4">
               <Heart size={24} />
             </div>
             <h3 className="text-lg font-medium text-zinc-900">No saved homes</h3>
             <p className="text-sm text-zinc-500 max-w-sm mt-1">Click the heart icon on any recommendation to save it here.</p>
           </div>
        )}
      </div>
    </div>
  );
}
