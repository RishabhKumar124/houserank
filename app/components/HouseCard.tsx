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
};

export function HouseCard({ house, score, index, formatMoney, openHouse, toggleFavorite, markVisited, deleteHouse, isSelected }: HouseCardProps) {
  return (
    <motion.article 
      whileHover={{ y: -4 }}
      className={`group flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl sm:rounded-3xl ${isSelected ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200/60'}`}
    >
      <button onClick={() => openHouse(house.id)} className="w-full text-left flex-1 flex flex-col focus:outline-none">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
          <Image src={house.photo} alt={house.address} fill priority={index === 0} unoptimized sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute top-4 left-4 flex gap-2">
             <span className="bg-white/90 backdrop-blur-sm text-zinc-900 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
               #{index + 1}
             </span>
          </div>
          <div className="absolute top-4 right-4">
            <div className="bg-zinc-900/90 backdrop-blur-sm text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-sm font-bold">{score.total}</span>
            </div>
          </div>
        </div>
        
        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <h3 className="mb-3 line-clamp-2 break-words font-semibold leading-tight text-zinc-900">{house.address}</h3>
          
          <div className="mb-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-600">
            <span className="flex min-w-0 items-center gap-1.5 font-medium text-zinc-900">
              <Home size={14} className="text-zinc-400" />
              {house.price ? formatMoney(house.price) : "?"}
            </span>
            <span className="flex items-center gap-1.5">
              <BedDouble size={14} className="text-zinc-400" /> {house.beds ?? "?"}
            </span>
            <span className="flex items-center gap-1.5">
              <Bath size={14} className="text-zinc-400" /> {house.baths ?? "?"}
            </span>
          </div>

          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed flex-1">
            {house.notes || "No notes yet. Click to add details or score this home."}
          </p>

          <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap gap-1.5">
            {score.flags.map((flag: string) => (
              <span key={flag} className="text-[10px] uppercase tracking-wide font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                {flag}
              </span>
            ))}
          </div>
        </div>
      </button>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-1 border-t border-zinc-50 bg-zinc-50/50 px-2 pb-2 pt-0 sm:px-3 sm:pb-3">
        <div className="mt-2 flex min-w-0 gap-0.5 sm:gap-1">
          <button onClick={() => toggleFavorite(house.id)} className={`p-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 ${house.favorite ? 'text-rose-500 bg-rose-50 hover:bg-rose-100' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50'}`} aria-label={house.favorite ? "Remove from favorites" : "Save as favorite"}>
            <Heart size={16} fill={house.favorite ? "currentColor" : "none"} />
          </button>
          <button onClick={() => openHouse(house.id, "details")} className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1" aria-label={`Open notes for ${house.address}`}>
            <NotebookPen size={16} />
          </button>
          <button onClick={() => markVisited(house.id)} className={`p-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 ${house.visitedAt ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50'}`} aria-label="Mark Visited">
            <ClipboardCheck size={16} />
          </button>
        </div>
        <div className="mt-2 flex min-w-0 gap-0.5 sm:gap-1">
          {house.url && (
            <a href={house.url} target="_blank" rel="noreferrer" aria-label={`Open original listing for ${house.address}`} className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1">
              <ExternalLink size={16} />
            </a>
          )}
          <button onClick={() => deleteHouse(house.id)} aria-label={`Delete ${house.address}`} className="p-2.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
