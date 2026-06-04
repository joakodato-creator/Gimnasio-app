import fs from 'fs';

const html = fs.readFileSync('C:\\Users\\Joaquin Alejo Dato\\.gemini\\antigravity\\scratch\\gimnasio\\standalone_preview.html', 'utf8');
const lines = html.split('\n');
for (let i = 291; i < 450; i++) {
  if (lines[i].includes('case')) {
    console.log(`${i + 1}: ${lines[i].trim()}`);
  }
}
