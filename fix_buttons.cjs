const fs = require('fs');

function fixGradientButtons(file) {
  let code = fs.readFileSync(file, 'utf8');
  // Revert buttons with gradient to text-white
  code = code.replace(/bg-gradient-to-r ([^"]*)text-slate-900/g, 'bg-gradient-to-r $1text-white');
  code = code.replace(/bg-zinc-900([^"]*)text-slate-900/g, 'bg-zinc-900$1text-white');
  fs.writeFileSync(file, code);
}

fixGradientButtons('app/components/HousePanels.tsx');
fixGradientButtons('app/components/tabs/RecommendationsTab.tsx');
// In HouseCard, there is an image gradient
// We also want to fix the active tab indicator text in page.tsx if it got broken
let pageCode = fs.readFileSync('app/page.tsx', 'utf8');
pageCode = pageCode.replace(/isActive \? 'text-slate-900'/g, "isActive ? 'text-white'");
fs.writeFileSync('app/page.tsx', pageCode);

console.log("Fixed buttons");
