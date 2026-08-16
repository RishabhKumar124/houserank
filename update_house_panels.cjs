const fs = require('fs');

let code = fs.readFileSync('app/components/HousePanels.tsx', 'utf8');

// Remove screenshot feature
// 1. Remove listingImage props from AddHousePanelProps
code = code.replace(/listingImage:\s*\{\s*name:\s*string;\s*size:\s*number;\s*\}\s*\|\s*null;\s*attachListingImage:\s*\(file:\s*File\)\s*=>\s*void;\s*clearListingImage:\s*\(\)\s*=>\s*void;/, '');

// 2. Remove listingImage from destructured AddHousePanelProps
code = code.replace(/listingImage,\s*attachListingImage,\s*clearListingImage,/, '');

// 3. Remove the Redfin screenshot UI block
code = code.replace(/<div className="block">\s*<span className=\{labelClass\}>Redfin screenshot<\/span>[\s\S]*?<\/div>\s*<\/div>/, '');

fs.writeFileSync('app/components/HousePanels.tsx', code);
