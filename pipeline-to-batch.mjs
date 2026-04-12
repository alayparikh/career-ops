import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';

const PIPELINE_FILE = './data/pipeline.md';
const BATCH_FILE    = './batch/batch-input.tsv';

if (!existsSync(PIPELINE_FILE)) {
  console.error('❌ data/pipeline.md not found. Run: node portal-scanner.mjs first');
  process.exit(1);
}

const existingURLs = new Set();
if (existsSync(BATCH_FILE)) {
  readFileSync(BATCH_FILE, 'utf8').split('\n').forEach(line => {
    const url = line.split('\t')[1]?.trim();
    if (url && url.startsWith('http')) existingURLs.add(url);
  });
  console.log(`📚 ${existingURLs.size} jobs already in batch file`);
}

const lines = readFileSync(PIPELINE_FILE, 'utf8').split('\n');
const newJobs = [];

lines.forEach(line => {
  if (!line.includes('- [ ]')) return;
  const urlMatch = line.match(/\(([^)]+)\)/);
  if (!urlMatch) return;
  const url = urlMatch[1].trim();
  if (!url.startsWith('http')) return;
  if (existingURLs.has(url)) return;
  const textMatch = line.match(/\[([^\]]+)\]/);
  const label = textMatch ? textMatch[1] : 'Unknown';
  const parts = label.split('—').map(s => s.trim());
  const company = parts[0] || 'Unknown';
  const title   = parts[1] || '';
  newJobs.push({ url, company, title });
});

if (newJobs.length === 0) {
  console.log('✅ No new jobs to add. All pipeline jobs already in batch.');
  process.exit(0);
}

let lastId = 0;
if (existsSync(BATCH_FILE)) {
  readFileSync(BATCH_FILE, 'utf8').split('\n').forEach(line => {
    const id = parseInt(line.split('\t')[0]);
    if (!isNaN(id) && id > lastId) lastId = id;
  });
}

let newLines = '';
if (!existsSync(BATCH_FILE)) {
  newLines += 'id\turl\tsource\tnotes\n';
}

newJobs.forEach((job, i) => {
  const id = String(lastId + i + 1).padStart(3, '0');
  newLines += `${id}\t${job.url}\tportal-scanner\t${job.company} — ${job.title}\n`;
});

appendFileSync(BATCH_FILE, newLines);

console.log('');
console.log(`✅ Added ${newJobs.length} new jobs to batch/batch-input.tsv`);
console.log('');
newJobs.forEach((job, i) => {
  console.log(`  ${lastId + i + 1}. [${job.company}] ${job.title}`);
  console.log(`     ${job.url}`);
});
console.log('');
console.log('Now run:');
console.log('  ./batch/batch-runner.sh --dry-run');
console.log('  ./batch/batch-runner.sh');
