import { motion } from "framer-motion";
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
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-300/50 rounded-3xl bg-white/50 backdrop-blur-sm"
           >
             <motion.div 
               animate={{ 
                 boxShadow: ["0 0 10px rgba(6,182,212,0.2)", "0 0 30px rgba(6,182,212,0.6)", "0 0 10px rgba(6,182,212,0.2)"],
                 scale: [1, 1.05, 1]
               }}
               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center rounded-2xl mb-6 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
             >
               <History size={28} />
             </motion.div>
             <h3 className="text-xl font-bold text-slate-900 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">No visits recorded yet</h3>
             <p className="text-sm text-slate-500 max-w-sm mt-2">Mark a home as visited to unlock the detailed scoring rubric for noise, light, layout, and safety.</p>
           </motion.div>
        )}
      </div>
    </div>
  );
}
