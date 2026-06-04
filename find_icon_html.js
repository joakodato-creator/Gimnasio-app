import fs from 'fs';

const html = fs.readFileSync('C:\\Users\\Joaquin Alejo Dato\\.gemini\\antigravity\\scratch\\gimnasio\\standalone_preview.html', 'utf8');
const lines = html.split('\n');
let capturing = false;
let capturedCount = 0;
lines.forEach((line, idx) => {
  if (line.includes('function Icon') || line.includes('const Icon =')) {
    capturing = true;
    capturedCount = 0;
    console.log(`--- Icon definition starting at line ${idx + 1} ---`);
  }
  if (capturing) {
    console.log(`${idx + 1}: ${line}`);
    capturedCount++;
    if (capturedCount > 30) {
      capturing = false;
    }
  }
});
