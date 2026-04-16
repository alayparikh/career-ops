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

  // Click "Apply Now" button if present (HPE and similar job description pages)
  const applyNowBtn = page.locator([
    'a:has-text("Apply Now")',
    'button:has-text("Apply Now")',
    'a:has-text("Apply now")',
    'button:has-text("Apply now")',
    '[data-ph-id*="apply"]',
    '.apply-button',
    '#apply-button'
  ].join(', ')).first();

  if (await applyNowBtn.count() > 0) {
    console.log('🖱️  Clicking Apply Now button...');
    await applyNowBtn.click();
    await page.waitForTimeout(3000);  // wait for redirect to actual form
    console.log('📄 Redirected to:', page.url());
  }

  // if (currentURL.includes('lever.co')) {
  //   console.log('🔧 Lever form detected');
  //   const fileInput = page.locator('input[type="file"]').first();
  //   if (await fileInput.count() > 0) {
  //     await fileInput.setInputFiles(MY_INFO.resumePath);
  //     console.log('📎 Resume uploaded — waiting for autofill...');
  //     await page.waitForTimeout(4000);
  //   }
  //   await fill(page, 'input[name="name"]',               MY_INFO.fullName);
  //   await fill(page, 'input[name="email"]',              MY_INFO.email);
  //   await fill(page, 'input[name="phone"]',              MY_INFO.phone);
  //   await fill(page, 'input[placeholder*="LinkedIn" i]', MY_INFO.linkedin);
  //   await fill(page, 'input[placeholder*="GitHub" i]',   MY_INFO.github);
  //   await fill(page, 'input[placeholder*="location" i]', MY_INFO.location);
  //   await fill(page, 'input[placeholder*="city" i]',     MY_INFO.location);
  //   await fill(page, 'input[name*="linkedin" i]',        MY_INFO.linkedin);
  //   await fill(page, 'input[name*="github" i]',          MY_INFO.github);

  // } else if (currentURL.includes('greenhouse.io')) {
  //   console.log('🔧 Greenhouse form detected');
  //   await fill(page, '#first_name', MY_INFO.firstName);
  //   await fill(page, '#last_name',  MY_INFO.lastName);
  //   await fill(page, '#email',      MY_INFO.email);
  //   await fill(page, '#phone',      MY_INFO.phone);
  //   const resumeInput = page.locator('#resume_upload input[type="file"], #resume input[type="file"]').first();
  //   if (await resumeInput.count() > 0) {
  //     await resumeInput.setInputFiles(MY_INFO.resumePath);
  //     console.log('📎 Resume uploaded');
  //     await page.waitForTimeout(3000);
  //   }
  //   await fill(page, 'input[id*="linkedin" i]', MY_INFO.linkedin);
  //   await fill(page, 'input[id*="github" i]',   MY_INFO.github);

  // } else if (currentURL.includes('workday.com') || currentURL.includes('myworkdayjobs.com')  || currentURL.includes('wd')) {
  //   console.log('⚠️  Workday detected — filling what we can...');
  //   await page.waitForTimeout(3000);
  //   await fill(page, 'input[data-automation-id="legalNameSection_firstName"]', MY_INFO.firstName);
  //   await fill(page, 'input[data-automation-id="legalNameSection_lastName"]',  MY_INFO.lastName);
  //   await fill(page, 'input[data-automation-id="email"]',                      MY_INFO.email);
  //   await fill(page, 'input[data-automation-id="phone-number"]',               MY_INFO.phone);

  // } else {
  //   console.log('⚠️  Unknown form — trying generic selectors...');
  //   await fill(page, 'input[name*="first" i]',    MY_INFO.firstName);
  //   await fill(page, 'input[name*="last" i]',     MY_INFO.lastName);
  //   await fill(page, 'input[type="email"]',       MY_INFO.email);
  //   await fill(page, 'input[type="tel"]',         MY_INFO.phone);
  //   await fill(page, 'input[name*="linkedin" i]', MY_INFO.linkedin);
  // }

  // console.log('');
  // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  // console.log('⏸️  REVIEW THE FORM IN THE BROWSER WINDOW');
  // console.log('   Press ENTER to SUBMIT ✅');
  // console.log('   Press Ctrl+C to CANCEL ❌');
  // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // await waitForEnter();

  // ── Smart Generic Form Filler ─────────────────────────────────────────────────
console.log('🧠 Smart form filler running...');
await page.waitForTimeout(2000);

// Upload resume first — works on any site
const fileInputs = page.locator('input[type="file"]');
if (await fileInputs.count() > 0) {
  await fileInputs.first().setInputFiles(MY_INFO.resumePath);
  console.log('📎 Resume uploaded — waiting for autofill...');
  await page.waitForTimeout(4000);
}

// Get ALL inputs/selects/textareas on page
const fields = await page.evaluate(() => {
  const results = [];

  document.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.type === 'hidden' || el.type === 'file' || el.type === 'submit'
        || el.type === 'button' || el.type === 'checkbox' || el.type === 'radio') return;

    // Find the best label for this field
    let label = '';

    // Method 1: <label for="id">
    if (el.id) {
      const lbl = document.querySelector(`label[for="${el.id}"]`);
      if (lbl) label = lbl.innerText.trim();
    }

    // Method 2: aria-label
    if (!label && el.getAttribute('aria-label')) {
      label = el.getAttribute('aria-label');
    }

    // Method 3: placeholder
    if (!label && el.placeholder) {
      label = el.placeholder;
    }

    // Method 4: name or id as last resort
    if (!label) label = el.name || el.id || '';

    results.push({
      tag:         el.tagName.toLowerCase(),
      type:        el.type || '',
      id:          el.id || '',
      name:        el.name || '',
      placeholder: el.placeholder || '',
      label:       label.toLowerCase(),
      value:       el.value || ''
    });
  });

  return results;
});

console.log(`📋 Found ${fields.length} fillable fields on page`);

// ── Fill each field based on label keyword matching ───────────────────────────
for (const field of fields) {
  const l = field.label;     // already lowercased
  const n = field.name.toLowerCase();
  const id = field.id.toLowerCase();
  const hint = `${l} ${n} ${id}`;  // combined hint string to match against

  let value = null;

  // Name fields
  if (/first.?name|given.?name|fname/.test(hint))        value = MY_INFO.firstName;
  else if (/last.?name|surname|family.?name|lname/.test(hint)) value = MY_INFO.lastName;
  else if (/^name$|full.?name|your name/.test(hint))     value = MY_INFO.fullName;

  // Contact
  else if (/email/.test(hint))                           value = MY_INFO.email;
  else if (/phone|mobile|cell|tel/.test(hint))           value = MY_INFO.phone;

  // Location
  else if (/address.?line.?1|street.?address|address1/.test(hint)) value = '6465 Riverchase Pkwy';
  else if (/^city$|city/.test(hint))                     value = MY_INFO.location.split(',')[0].trim();
  else if (/zip|postal/.test(hint))                      value = '30328';

  // Professional
  else if (/linkedin/.test(hint))                        value = MY_INFO.linkedin;
  else if (/github/.test(hint))                          value = MY_INFO.github;
  else if (/website|portfolio|personal.?url/.test(hint)) value = MY_INFO.linkedin;

  // Visa / Work Authorization — always "yes" to sponsorship question
  else if (/sponsorship|visa|work.?auth|authorized|eligible/.test(hint)) value = null; // handle dropdowns separately

  if (value && field.tag === 'input') {
    try {
      const selector = field.id
        ? `#${field.id}`
        : field.name
          ? `[name="${field.name}"]`
          : null;
      if (selector) {
        await page.fill(selector, value);
        console.log(`  ✏️  "${field.label || field.name}" → "${value}"`);
      }
    } catch(e) {
      console.log(`  ⚠️  Could not fill "${field.label}": ${e.message}`);
    }
  }

  // Handle <select> dropdowns
  if (field.tag === 'select') {
    let selectValue = null;

    if (/state|province/.test(hint))                     selectValue = 'Georgia';
    else if (/country/.test(hint))                       selectValue = 'United States';
    else if (/sponsorship|visa|authorized/.test(hint))   selectValue = 'Yes';
    else if (/gender/.test(hint))                        selectValue = 'Decline';
    else if (/veteran/.test(hint))                       selectValue = 'I am not';
    else if (/disability/.test(hint))                    selectValue = 'No';

    if (selectValue) {
      const selector = field.id ? `#${field.id}` : `[name="${field.name}"]`;
      try {
        await page.selectOption(selector, { label: new RegExp(selectValue, 'i') })
          .catch(() => page.selectOption(selector, { value: selectValue }))
          .catch(() => console.log(`  ⚠️  Could not select "${selectValue}" for "${field.label}"`));
        console.log(`  📋 "${field.label || field.name}" → "${selectValue}"`);
      } catch(e) {}
    }
  }
}

// ── Handle "Next" button for multi-step forms (HPE, Taleo, iCIMS) ─────────────
const nextBtn = page.locator([
  'button:has-text("Next")',
  'button:has-text("Continue")',
  'input[value="Next"]',
  'a:has-text("Next step")',
].join(', ')).first();

if (await nextBtn.count() > 0) {
  console.log('');
  console.log('⚠️  Multi-step form detected — review Step 1 first');
  console.log('   Press ENTER to go to Next Step, Ctrl+C to cancel');
}

  const submitBtn = page.locator([
    'button[type="submit"]:not(:has-text("Next")):not(:has-text("Continue"))',
    'input[type="submit"]',
    'button:has-text("Submit Application")',
    'button:has-text("Send Application")',
    'button:has-text("Submit my application")',
    'button:has-text("Complete Application")',
  ].join(', ')).first();

  if (await submitBtn.count() > 0) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏸️  REVIEW THE FORM IN THE BROWSER WINDOW');
    console.log('   Press ENTER to SUBMIT ✅');
    console.log('   Press Ctrl+C to CANCEL ❌');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await waitForEnter();
    await submitBtn.click();
    console.log('🚀 Application submitted!');
    await page.waitForTimeout(4000);
    await logToTracker(JOB_URL);
  } else {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏸️  No submit button found automatically.');
    console.log('   Click Submit manually in the browser.');
    console.log('   Then press ENTER here to log it. ✅');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await waitForEnter();
    await logToTracker(JOB_URL);
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