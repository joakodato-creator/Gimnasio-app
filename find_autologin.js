import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\Joaquin Alejo Dato\\.gemini\\antigravity\\scratch\\gimnasio\\src\\App.jsx', 'utf8');
const lines = content.split('\n');

console.log('Searching for timers, useEffects, or session restoring logic...');
lines.forEach((line, index) => {
  if (line.includes('useEffect') || line.includes('setTimeout') || line.includes('setCurrentUser') || line.includes('localStorage.getItem')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
