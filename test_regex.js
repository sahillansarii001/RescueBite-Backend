import fs from 'fs';

const html = fs.readFileSync('map_page.html', 'utf8');

const lats = new Set(html.match(/19\.\d{4,8}/g) || []);
const lons = new Set(html.match(/72\.\d{4,8}/g) || []);

console.log("Unique 19.xxxx matches:", Array.from(lats));
console.log("Unique 72.xxxx matches:", Array.from(lons));

// Let's also check for specific Govandi coords if they exist in some other form (e.g. 19.05, 19.06)
const allLats = Array.from(new Set(html.match(/19\.\d+/g) || []));
const allLons = Array.from(new Set(html.match(/72\.\d+/g) || []));
console.log("All unique lat matches:", allLats.filter(l => l.startsWith("19.0") || l.startsWith("19.1")));
console.log("All unique lon matches:", allLons.filter(l => l.startsWith("72.9") || l.startsWith("72.8")));
