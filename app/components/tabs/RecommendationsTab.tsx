import { HouseCard } from "../HouseCard";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
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
  compareIds: string[];
  onToggleCompare: (id: string) => void;
};

export function RecommendationsTab({ houses, formatMoney, openHouse, toggleFavorite, markVisited, deleteHouse, setHousePanel, selectedId, compareIds, onToggleCompare }: HouseListProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">House Recommendations</h2>
          <p className="text-sm text-slate-500 mt-1">Every home ranked against your budget, safety, and buyer priorities.</p>
        </div>
        <button onClick={() => setHousePanel("add")} className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.8)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-slate-900">
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
            isComparing={compareIds.includes(house.id)}
            onToggleCompare={onToggleCompare}
          />
        ))}
        {houses.length === 0 && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-300/50 rounded-3xl bg-white/50 backdrop-blur-sm"
           >
             <motion.div 
               animate={{ 
                 boxShadow: ["0 0 10px rgba(192,38,211,0.2)", "0 0 30px rgba(192,38,211,0.6)", "0 0 10px rgba(192,38,211,0.2)"],
                 scale: [1, 1.05, 1]
               }}
               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               className="w-14 h-14 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/30 text-fuchsia-400 flex items-center justify-center rounded-2xl mb-6 shadow-[0_0_20px_rgba(192,38,211,0.3)]"
             >
               <Plus size={28} />
             </motion.div>
             <h3 className="text-xl font-bold text-slate-900 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">No homes added yet</h3>
             <p className="text-sm text-slate-500 max-w-sm mt-2">Add a Zillow or Redfin link to start tracking and ranking homes automatically.</p>
           </motion.div>
        )}
      </div>
    </div>
  );
}
