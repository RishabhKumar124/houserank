import { Home, BedDouble, Bath, Heart, ExternalLink, NotebookPen, ClipboardCheck, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { House, HousePanel, Score } from "../../lib/types";

type HouseCardProps = {
  house: House;
  score: Score;
  index: number;
  formatMoney: (value?: number) => string;
  openHouse: (id: string, panel?: Exclude<HousePanel, "add" | null>) => void;
  toggleFavorite: (id: string) => void;
  markVisited: (id: string) => void;
  deleteHouse: (id: string) => void;
  isSelected: boolean;
  isComparing?: boolean;
  onToggleCompare?: (id: string) => void;
};

export function HouseCard({ house, score, index, formatMoney, openHouse, toggleFavorite, markVisited, deleteHouse, isSelected, isComparing, onToggleCompare }: HouseCardProps) {
  return (
    <motion.article 
      whileHover={{ y: -4 }}
      className={`group flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border bg-white/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] transition-all duration-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] sm:rounded-3xl ${isSelected ? 'border-fuchsia-500 ring-1 ring-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.5)]' : 'border-slate-300 hover:border-white/40'}`}
    >
      <button onClick={() => openHouse(house.id)} className="w-full text-left flex-1 flex flex-col focus:outline-none">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-800/50 shadow-[inset_0_-20px_60px_rgba(0,0,0,0.5)]">
          <Image src={house.photo} alt={house.address} fill priority={index === 0} unoptimized sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-90" />
          <div className="absolute top-4 left-4 flex gap-2">
             <span className="bg-white/70 backdrop-blur-md text-slate-900 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm border border-slate-300">
               #{index + 1}
             </span>
             {onToggleCompare && (
               <div className="flex items-center justify-center" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="presentation">
                 <input aria-label={`Select ${house.address} to compare`} type="checkbox" checked={isComparing || false} onChange={() => onToggleCompare(house.id)} className="w-6 h-6 rounded border-white/40 bg-white/20 text-fuchsia-500 focus:ring-fuchsia-500 backdrop-blur-md shadow-lg" />
               </div>
             )}
          </div>
          <div className="absolute top-4 right-4">
            <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 backdrop-blur-md text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(192,38,211,0.6)]">
              <span className="text-sm font-bold">{score.total}</span>
            </div>
          </div>
        </div>
        
        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5 relative z-10">
          <h3 className="mb-3 line-clamp-2 break-words font-semibold leading-tight text-slate-900">{house.address}</h3>
          
          <div className="mb-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-700">
            <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-900">
              <Home size={14} className="text-slate-500" />
              {house.price ? formatMoney(house.price) : "?"}
            </span>
            <span className="flex items-center gap-1.5">
              <BedDouble size={14} className="text-slate-500" /> {house.beds ?? "?"}
            </span>
            <span className="flex items-center gap-1.5">
              <Bath size={14} className="text-slate-500" /> {house.baths ?? "?"}
            </span>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
            {house.notes || "No notes yet. Click to add details or score this home."}
          </p>

          <div className="mt-4 pt-4 border-t border-slate-300/50 flex flex-wrap gap-1.5">
            {score.flags.map((flag: string) => (
              <span key={flag} className="text-[10px] uppercase tracking-wide font-semibold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/30">
                {flag}
              </span>
            ))}
          </div>
        </div>
      </button>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-1 border-t border-slate-300/50 bg-transparent px-2 pb-2 pt-0 sm:px-3 sm:pb-3 relative z-10">
        <div className="mt-2 flex min-w-0 gap-0.5 sm:gap-1">
          <button onClick={() => toggleFavorite(house.id)} className={`p-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-1 ${house.favorite ? 'text-rose-400 bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'}`} aria-label={house.favorite ? "Remove from saved homes" : "Save home"}>
            <Heart size={16} fill={house.favorite ? "currentColor" : "none"} />
          </button>
          <button onClick={() => openHouse(house.id, "details")} className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-1" aria-label={`Open notes for ${house.address}`}>
            <NotebookPen size={16} />
          </button>
          <button onClick={() => markVisited(house.id)} className={`p-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-1 ${house.visitedAt ? 'text-cyan-400 bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'}`} aria-label="Mark Visited">
            <ClipboardCheck size={16} />
          </button>
        </div>
        <div className="mt-2 flex min-w-0 gap-0.5 sm:gap-1">
          {house.url && (
            <a href={house.url} target="_blank" rel="noreferrer" aria-label={`Open original listing for ${house.address}`} className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-white/60 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-1">
              <ExternalLink size={16} />
            </a>
          )}
          <button onClick={(e) => { e.stopPropagation(); deleteHouse(house.id); }} aria-label={`Delete ${house.address}`} className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
