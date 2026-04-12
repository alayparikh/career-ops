import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import yaml from 'js-yaml';

const JOB_URL = process.argv[2];
if (!JOB_URL) {
  console.error('Usage: node auto-apply.mjs <job-url>');
  process.exit(1);
}

const profile = yaml.load(readFileSync('./config/profile.yml', 'utf8'));
const me = profile.candidate;
const nameParts = me.full_name.trim().split(' ');

const MY_INFO = {
  firstName:  nameParts[0],
  lastName:   nameParts.slice(1).join(' '),
  fullName:   me.full_name,
  email:      me.email,
  phone:      me.phone,
  linkedin:   me.linkedin,
  github:     me.github || '',
  location:   me.location,
  resumePath: './output/resume.pdf'
};

if (!existsSync(MY_INFO.resumePath)) {
  console.error(`❌ Resume not found at ${MY_INFO.resumePath}`);
  console.error('   Run: node generate-pdf.mjs templates/resume.html output/resume.pdf --format=letter');
  process.exit(1);
}

console.log('');
console.log('🤖 Auto-Apply Starting');
console.log(`👤 Applying as: ${MY_INFO.fullName} (${MY_INFO.email})`);
console.log(`🔗 URL: ${JOB_URL}`);
console.log('');

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();

try {
  await page.goto(JOB_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  const currentURL = page.url();
  console.log('📄 Loaded:', currentURL);

  if (currentURL.includes('lever.co')) {
    console.log('🔧 Lever form detected');
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(MY_INFO.resumePath);
      console.log('📎 Resume uploaded — waiting for autofill...');
      await page.waitForTimeout(4000);
    }
    await fill(page, 'input[name="name"]',               MY_INFO.fullName);
    await fill(page, 'input[name="email"]',              MY_INFO.email);
    await fill(page, 'input[name="phone"]',              MY_INFO.phone);
    await fill(page, 'input[placeholder*="LinkedIn" i]', MY_INFO.linkedin);
    await fill(page, 'input[placeholder*="GitHub" i]',   MY_INFO.github);
    await fill(page, 'input[placeholder*="location" i]', MY_INFO.location);
    await fill(page, 'input[placeholder*="city" i]',     MY_INFO.location);
    await fill(page, 'input[name*="linkedin" i]',        MY_INFO.linkedin);
    await fill(page, 'input[name*="github" i]',          MY_INFO.github);

  } else if (currentURL.includes('greenhouse.io')) {
    console.log('🔧 Greenhouse form detected');
    await fill(page, '#first_name', MY_INFO.firstName);
    await fill(page, '#last_name',  MY_INFO.lastName);
    await fill(page, '#email',      MY_INFO.email);
    await fill(page, '#phone',      MY_INFO.phone);
    const resumeInput = page.locator('#resume_upload input[type="file"], #resume input[type="file"]').first();
    if (await resumeInput.count() > 0) {
      await resumeInput.setInputFiles(MY_INFO.resumePath);
      console.log('📎 Resume uploaded');
      await page.waitForTimeout(3000);
    }
    await fill(page, 'input[id*="linkedin" i]', MY_INFO.linkedin);
    await fill(page, 'input[id*="github" i]',   MY_INFO.github);

  } else if (currentURL.includes('workday.com') || currentURL.includes('myworkdayjobs.com')) {
    console.log('⚠️  Workday detected — filling what we can...');
    await page.waitForTimeout(3000);
    await fill(page, 'input[data-automation-id="legalNameSection_firstName"]', MY_INFO.firstName);
    await fill(page, 'input[data-automation-id="legalNameSection_lastName"]',  MY_INFO.lastName);
    await fill(page, 'input[data-automation-id="email"]',                      MY_INFO.email);
    await fill(page, 'input[data-automation-id="phone-number"]',               MY_INFO.phone);

  } else {
    console.log('⚠️  Unknown form — trying generic selectors...');
    await fill(page, 'input[name*="first" i]',    MY_INFO.firstName);
    await fill(page, 'input[name*="last" i]',     MY_INFO.lastName);
    await fill(page, 'input[type="email"]',       MY_INFO.email);
    await fill(page, 'input[type="tel"]',         MY_INFO.phone);
    await fill(page, 'input[name*="linkedin" i]', MY_INFO.linkedin);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏸️  REVIEW THE FORM IN THE BROWSER WINDOW');
  console.log('   Press ENTER to SUBMIT ✅');
  console.log('   Press Ctrl+C to CANCEL ❌');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await waitForEnter();

  const submitBtn = page.locator([
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Submit")',
    'button:has-text("Apply")',
    'button:has-text("Send Application")',
  ].join(', ')).first();

  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    console.log('🚀 Application submitted!');
    await page.waitForTimeout(4000);
    await logToTracker(JOB_URL);
  } else {
    console.log('❌ Submit button not found — click it manually in the browser.');
    await page.waitForTimeout(30000);
  }

} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await browser.close();
  console.log('✅ Done.');
}

async function fill(page, selector, value) {
  if (!value) return;
  try {
    const el = page.locator(selector).first();
    if (await el.count() > 0) {
      await el.clear();
      await el.fill(value);
      console.log(`  ✏️  ${selector.substring(0,40)} → "${value}"`);
    }
  } catch { /* skip missing fields */ }
}

function waitForEnter() {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question('', () => { rl.close(); resolve(); });
  });
}

async function logToTracker(url) {
  try {
    const { appendFileSync } = await import('fs');
    const date = new Date().toISOString().split('T')[0];
    appendFileSync('./data/applications.md', `${date}\t${url}\tApplied\tauto-apply.mjs\n`);
    console.log('📋 Logged to data/applications.md');
  } catch {
    console.log('⚠️  Could not log to tracker');
  }
}