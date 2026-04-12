import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const yaml = require('js-yaml');

// ── Config ────────────────────────────────────────────────────────────────────
const PORTALS_FILE   = './portals.yml';
const PIPELINE_FILE  = './data/pipeline.md';
const HISTORY_FILE   = './data/scan-history.tsv';
const MAX_JOBS_PER_COMPANY = 20;   // cap per company to avoid flooding
const HEADLESS = true;             // set false to watch browser

// ── Load portals config ───────────────────────────────────────────────────────
if (!existsSync(PORTALS_FILE)) {
  console.error(`❌ ${PORTALS_FILE} not found. Create it from templates/portals.example.yml`);
  process.exit(1);
}

const config = yaml.load(readFileSync(PORTALS_FILE, 'utf8'));
const titleFilter = config.title_filter || { positive: [], negative: [], seniority_boost: [] };
const companies   = (config.tracked_companies || []).filter(c => c.enabled !== false);

// ── Load scan history (dedup) ─────────────────────────────────────────────────
const seenURLs = new Set();
if (existsSync(HISTORY_FILE)) {
  readFileSync(HISTORY_FILE, 'utf8').split('\n').forEach(line => {
    const url = line.split('\t')[0]?.trim();
    if (url) seenURLs.add(url);
  });
}
console.log(`📚 Loaded ${seenURLs.size} seen URLs from history`);

// ── Title filter ──────────────────────────────────────────────────────────────
function isRelevant(title) {
  if (!title) return false;
  const t = title.toLowerCase();

  const hasPositive = titleFilter.positive.some(k => t.includes(k.toLowerCase()));
  const hasNegative = titleFilter.negative.some(k => t.includes(k.toLowerCase()));

  return hasPositive && !hasNegative;
}

function getSeniorityBoost(title) {
  return titleFilter.seniority_boost?.some(k =>
    title.toLowerCase().includes(k.toLowerCase())
  ) ? '⭐' : '';
}

// ── Results store ─────────────────────────────────────────────────────────────
const newJobs = [];

// ── Greenhouse API scanner (fastest) ─────────────────────────────────────────
async function scanGreenhouseAPI(company) {
  try {
    const res = await fetch(company.api);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const jobs = data.jobs || [];

    let found = 0;
    for (const job of jobs) {
      const title = job.title || '';
      const url   = job.absolute_url || '';
      if (!isRelevant(title)) continue;
      if (seenURLs.has(url)) continue;
      if (found >= MAX_JOBS_PER_COMPANY) break;

      newJobs.push({ company: company.name, title, url, source: 'greenhouse_api' });
      seenURLs.add(url);
      found++;
    }
    console.log(`  ✅ Greenhouse API: ${found} new jobs found`);
  } catch (err) {
    console.log(`  ⚠️  Greenhouse API failed: ${err.message} — falling back to Playwright`);
    return false;
  }
  return true;
}

// ── Playwright scanner ────────────────────────────────────────────────────────
async function scanWithPlaywright(page, company) {
  try {
    console.log(`  🌐 Playwright: ${company.careers_url}`);
    await page.goto(company.careers_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    // Try multiple common job listing selectors
    const jobs = await page.evaluate(() => {
      const results = [];

      // Strategy 1: anchor tags with job-like hrefs
      document.querySelectorAll('a[href]').forEach(el => {
        const href = el.href;
        const text = el.innerText?.trim();
        if (!text || text.length < 3 || text.length > 120) return;

        const isJobLink =
          href.includes('/jobs/') ||
          href.includes('/careers/') ||
          href.includes('/positions/') ||
          href.includes('/openings/') ||
          href.includes('lever.co') ||
          href.includes('greenhouse.io') ||
          href.includes('ashbyhq.com') ||
          href.includes('workday.com') ||
          href.includes('myworkdayjobs.com') ||
          href.includes('/job/') ||
          href.includes('/apply');

        if (isJobLink) results.push({ title: text, url: href });
      });

      return results;
    });

    // Deduplicate by URL
    const seen = new Set();
    let found = 0;
    for (const job of jobs) {
      if (seen.has(job.url)) continue;
      seen.add(job.url);
      if (!isRelevant(job.title)) continue;
      if (seenURLs.has(job.url)) continue;
      if (found >= MAX_JOBS_PER_COMPANY) break;

      newJobs.push({ company: company.name, title: job.title, url: job.url, source: 'playwright' });
      seenURLs.add(job.url);
      found++;
    }
    console.log(`  ✅ Playwright: ${found} new relevant jobs found`);
  } catch (err) {
    console.log(`  ❌ Playwright failed: ${err.message}`);
  }
}

// ── Main scanner loop ─────────────────────────────────────────────────────────
console.log('');
console.log('🚀 Career-Ops Portal Scanner');
console.log(`📋 Scanning ${companies.length} companies from portals.yml`);
console.log('');

const browser = await chromium.launch({ headless: HEADLESS });
const page    = await browser.newPage();

// Set a real browser user-agent to avoid bot detection
await page.setExtraHTTPHeaders({
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
});

for (const company of companies) {
  console.log(`🏢 ${company.name}`);

  // Use Greenhouse API if available (faster, more reliable)
  if (company.api) {
    const ok = await scanGreenhouseAPI(company);
    if (ok) continue;
  }

  // Fall back to Playwright
  await scanWithPlaywright(page, company);
}

await browser.close();

// ── Write results ─────────────────────────────────────────────────────────────
console.log('');
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅ Scan complete — ${newJobs.length} new jobs found`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log('');

if (newJobs.length === 0) {
  console.log('No new jobs found. Try again tomorrow or add more companies to portals.yml');
  process.exit(0);
}

// Print all found jobs
newJobs.forEach((job, i) => {
  const boost = getSeniorityBoost(job.title);
  console.log(`  ${i + 1}. ${boost}[${job.company}] ${job.title}`);
  console.log(`     ${job.url}`);
  console.log('');
});

// ── Save to data/pipeline.md (for batch evaluation) ───────────────────────────
const date = new Date().toISOString().split('T')[0];
const pipelineLines = newJobs.map(job =>
  `- [ ] [${job.company} — ${job.title}](${job.url}) <!-- scanned: ${date} -->`
).join('\n');

const pipelineEntry = `\n\n## Scan: ${date}\n\n${pipelineLines}\n`;

if (!existsSync('./data')) {
  import('fs').then(fs => fs.mkdirSync('./data', { recursive: true }));
}

appendFileSync(PIPELINE_FILE, pipelineEntry);
console.log(`📄 ${newJobs.length} jobs added to ${PIPELINE_FILE}`);

// ── Update scan history (dedup for next run) ──────────────────────────────────
const historyLines = newJobs.map(job =>
  `${job.url}\t${job.company}\t${job.title}\t${date}`
).join('\n') + '\n';

appendFileSync(HISTORY_FILE, historyLines);
console.log(`📚 Scan history updated (${HISTORY_FILE})`);

// ── Summary ────────────────────────────────────────────────────────────────────
console.log('');
console.log('Next step — evaluate all found jobs:');
console.log('  ./batch/batch-runner.sh');
console.log('');
console.log('Or evaluate one at a time:');
newJobs.slice(0, 3).forEach(job => {
  console.log(`  ./scrape-job.sh "${job.url}"`);
});