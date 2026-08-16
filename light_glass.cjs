const fs = require('fs');

function makeLightGlass(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Backgrounds
  code = code.replace(/bg-slate-900\/60/g, 'bg-white/80');
  code = code.replace(/bg-slate-900\/80/g, 'bg-white/90');
  code = code.replace(/bg-white\/5/g, 'bg-white/50');
  code = code.replace(/bg-white\/10/g, 'bg-white/60');
  code = code.replace(/bg-white\/20/g, 'bg-white/70');
  
  // Texts
  code = code.replace(/text-white\/40/g, 'text-slate-400');
  code = code.replace(/text-white\/50/g, 'text-slate-500');
  code = code.replace(/text-white\/60/g, 'text-slate-600');
  code = code.replace(/text-white\/70/g, 'text-slate-700');
  code = code.replace(/text-white\/80/g, 'text-slate-800');
  code = code.replace(/text-white\/90/g, 'text-slate-900');
  code = code.replace(/text-white/g, 'text-slate-900');
  
  // Placeholders
  code = code.replace(/placeholder-white\/40/g, 'placeholder-slate-400');
  
  // Borders
  code = code.replace(/border-white\/10/g, 'border-slate-300/50');
  code = code.replace(/border-white\/20/g, 'border-slate-300');
  code = code.replace(/border-white\/30/g, 'border-slate-400');
  
  fs.writeFileSync(file, code);
}

makeLightGlass('app/components/HousePanels.tsx');
makeLightGlass('app/components/HouseCard.tsx');

// Also update RecommendationsTab, SavedTab, VisitedTab because they might have text-white
makeLightGlass('app/components/tabs/RecommendationsTab.tsx');
makeLightGlass('app/components/tabs/SavedTab.tsx');
makeLightGlass('app/components/tabs/VisitedTab.tsx');

// And page.tsx for the nav bar
makeLightGlass('app/page.tsx');

console.log("Done");
