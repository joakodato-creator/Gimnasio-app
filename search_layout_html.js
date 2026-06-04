import fs from 'fs';

const html = fs.readFileSync('C:\\Users\\Joaquin Alejo Dato\\.gemini\\antigravity\\scratch\\gimnasio\\standalone_preview.html', 'utf8');
const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Navegación por Pestañas del Cliente') || line.includes('Gimnasio Performance S.A.')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
