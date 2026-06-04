import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\Joaquin Alejo Dato\\.gemini\\antigravity\\scratch\\gimnasio\\src\\App.jsx', 'utf8');
const lines = content.split('\n');
console.log('Searching for tab buttons or activeTab triggers...');
lines.forEach((line, idx) => {
  if (line.includes('activeTab') && (line.includes('button') || line.includes('onClick'))) {
    if (idx > 500 && idx < 1000) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
