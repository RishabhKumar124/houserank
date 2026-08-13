import fs from 'fs';
import path from 'path';

const pagePath = path.join(process.cwd(), 'app', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

const returnStartStr = '  return (\n    <main className="app-shell">';
const returnStartIndex = content.indexOf(returnStartStr);

if (returnStartIndex === -1) {
  console.error("Could not find the start of the return statement.");
  process.exit(1);
}

const beforeReturn = content.slice(0, returnStartIndex);

const newJSX = `  // ===== NEW UI DRIVEN BY FRAMER MOTION & PREMIUM TASTE =====
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-200">
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-zinc-200/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <Home size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500 leading-none">HouseRank</p>
              <h1 className="text-sm font-medium leading-tight">Home Buying Assistant</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full mr-2">
              {saveState}
            </span>
            <button onClick={installApp} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1">
              <Smartphone size={18} />
            </button>
            <button onClick={() => importInputRef.current?.click()} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1">
              <Upload size={18} />
            </button>
            <button onClick={exportData} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1">
              <Download size={18} />
            </button>
            <input ref={importInputRef} type="file" accept="application/json" onChange={importData} className="hidden" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <nav className="flex space-x-1 p-1 bg-zinc-100/80 backdrop-blur-md rounded-2xl w-fit mb-8 border border-zinc-200/50 shadow-sm relative">
          {([
            ["recommendations", Search, "Recommendations", houses.length],
            ["saved", Heart, "Saved", houses.filter((h) => h.favorite).length],
            ["visited", History, "Visited", houses.filter((h) => h.visitedAt).length],
            ["profile", UserRound, "Profile", null],
          ] as const).map(([tab, Icon, label, count]) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setHousePanel(null); }}
                className={\`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1 z-10 \${isActive ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'}\`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.05)] border border-black/[0.04]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative flex items-center gap-2 z-20">
                  <Icon size={16} className={isActive ? 'text-zinc-900' : 'text-zinc-400'} />
                  {label}
                  {count !== null && (
                    <span className={\`text-[10px] px-1.5 py-0.5 rounded-full \${isActive ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-200/50 text-zinc-500'}\`}>
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="w-full"
          >
            {activeTab === "profile" && <ProfileTab profile={profile} updateProfile={updateProfile} suggestion={suggestion} applySuggestion={applySuggestion} personalLenses={personalLenses} />}
            {activeTab === "recommendations" && <RecommendationsTab houses={scoredHouses} formatMoney={formatMoney} suggestion={suggestion} openHouse={openHouse} toggleFavorite={toggleFavorite} markVisited={markVisited} deleteHouse={deleteHouse} best={best} setHousePanel={setHousePanel} selectedId={selectedId} />}
            {activeTab === "saved" && <SavedTab houses={visibleHouses} formatMoney={formatMoney} openHouse={openHouse} toggleFavorite={toggleFavorite} markVisited={markVisited} deleteHouse={deleteHouse} selectedId={selectedId} />}
            {activeTab === "visited" && <VisitedTab houses={visibleHouses} formatMoney={formatMoney} openHouse={openHouse} toggleFavorite={toggleFavorite} markVisited={markVisited} deleteHouse={deleteHouse} selectedId={selectedId} />}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {housePanel && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setHousePanel(null)}
                className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: "100%", opacity: 0, scale: 0.95 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                className="fixed top-4 bottom-4 right-4 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col border border-zinc-100"
              >
                {housePanel === "add" && <AddHousePanel draft={draft} setDraft={setDraft} addListing={addListing} setHousePanel={setHousePanel} inferAddress={inferAddress} />}
                {housePanel !== "add" && selectedHouse && selectedScore && (
                  <HouseDetailPanel house={selectedHouse} score={selectedScore} updateHouse={updateHouse} updateHouseNumber={updateHouseNumber} setCriterion={setCriterion} setHousePanel={setHousePanel} markVisited={markVisited} isVisitMode={housePanel === "visit"} />
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
`;

const importsToAdd = `
import { motion, AnimatePresence } from "framer-motion";
import { ProfileTab } from "./components/tabs/ProfileTab";
import { RecommendationsTab } from "./components/tabs/RecommendationsTab";
import { SavedTab } from "./components/tabs/SavedTab";
import { VisitedTab } from "./components/tabs/VisitedTab";
import { AddHousePanel, HouseDetailPanel } from "./components/HousePanels";
`;

let finalContent = beforeReturn + newJSX;
// Inject imports at the top, just after "use client";
finalContent = finalContent.replace(/"use client";/, '"use client";\\n' + importsToAdd);

fs.writeFileSync(pagePath, finalContent, 'utf8');
console.log('Successfully refactored page.tsx');
