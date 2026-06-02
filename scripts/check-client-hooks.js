const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'app');
const hookRegex = /\b(useState|useEffect|useRef|useMemo|useCallback|useReducer|useSyncExternalStore)\b/;

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else if (/\.tsx?$/.test(name)) files.push(full);
  }
  return files;
}

const files = walk(dir);
const offenders = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  if (hookRegex.test(txt)) {
    const firstLines = txt.split(/\r?\n/).slice(0,5).join('\n');
    if (!/^\s*"use client"|^\s*'use client'/m.test(firstLines)) {
      offenders.push({ file: f, firstLines });
    }
  }
}

if (offenders.length === 0) {
  console.log('No offenders found. All files with hooks have `use client` at the top.');
} else {
  console.log('Files using hooks without `use client` on first 5 lines:');
  for (const o of offenders) {
    console.log('- ' + path.relative(process.cwd(), o.file));
  }
}
