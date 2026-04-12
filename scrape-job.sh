#!/usr/bin/env bash
set -euo pipefail

JOB_URL="$1"

if [[ -z "$JOB_URL" ]]; then
  echo "Usage: ./scrape-job.sh <job-url>"
  exit 1
fi

echo "🔍 Fetching job posting from: $JOB_URL"
echo ""

# Step 1: Scrape the job page
JOB_TEXT=$(node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('$JOB_URL', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text);
  await browser.close();
})();
")

if [[ -z "$JOB_TEXT" ]]; then
  echo "❌ ERROR: Could not scrape the job page."
  exit 1
fi

echo "✅ Job page scraped successfully"

# Trim to 3000 chars to keep prompt size manageable
JOB_TEXT=$(echo "$JOB_TEXT" | head -c 3000)

# Step 2: Build the full prompt
SYSTEM_CONTEXT=$(cat modes/oferta.md modes/_shared.md cv.md config/profile.yml)

FULL_PROMPT="${SYSTEM_CONTEXT}

---

## JOB DESCRIPTION TO EVALUATE

URL: ${JOB_URL}

${JOB_TEXT}

---

Evaluate this job using the 10-dimension scoring system. Output the full 6-block report in markdown."

# Step 3: Save to temp files
TEMP_PROMPT_FILE=$(mktemp /tmp/career-ops-prompt-XXXX.txt)
TEMP_JSON_FILE=$(mktemp /tmp/career-ops-payload-XXXX.json)

echo "$FULL_PROMPT" > "$TEMP_PROMPT_FILE"

python3 -c "
import json
prompt = open('$TEMP_PROMPT_FILE').read()
payload = {
    'model': 'qwen3.5:latest',
    'prompt': prompt,
    'stream': False,
    'options': {'temperature': 0.3, 'num_ctx': 32768}
}
json.dump(payload, open('$TEMP_JSON_FILE', 'w'))
print('📦 Prompt size:', len(prompt), 'chars')
"

echo "🤖 Sending to Qwen 3.5 (may take 2-5 mins)..."
echo ""

# Step 4: Call Ollama with 10 min timeout
RESPONSE=$(curl -s \
  --max-time 600 \
  --connect-timeout 10 \
  -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d @"$TEMP_JSON_FILE")

rm -f "$TEMP_PROMPT_FILE" "$TEMP_JSON_FILE"

# Step 5: Extract and print the result
EVAL_REPORT=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('response', ''))
except:
    print('ERROR: Could not parse response')
")

echo "$EVAL_REPORT"

# Step 6: Save report to file
mkdir -p reports
REPORT_NAME=$(echo "$JOB_URL" | sed 's|https://||' | sed 's|[^a-zA-Z0-9]|-|g' | cut -c1-60)
REPORT_FILE="reports/${REPORT_NAME}.md"
echo "$EVAL_REPORT" > "$REPORT_FILE"
echo ""
echo "📄 Report saved → $REPORT_FILE"

# Step 7: Detect grade
GRADE=$(echo "$EVAL_REPORT" | grep -oiE 'FINAL_GRADE:\s*[A-F]' | grep -oE '[A-F]$' | head -1)
if [[ -z "$GRADE" ]]; then
  GRADE=$(echo "$EVAL_REPORT" | grep -oiE '(Final Grade|Grade|Score)[: ]+[A-F]' | grep -oE '[A-F]$' | head -1)
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Detected Grade: ${GRADE:-NOT FOUND}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 8: Auto-apply decision
# ✏️  EDIT THIS LIST to control which grades trigger auto-apply
# ("A" "B") = only A and B
# ("A" "B" "C") = A, B, and C
# ("A" "B" "C" "D" "F") = always apply
AUTO_APPLY_GRADES=("A" "B" "C" "D" "F")

SHOULD_APPLY=false
for g in "${AUTO_APPLY_GRADES[@]}"; do
  if [[ "$GRADE" == "$g" ]]; then
    SHOULD_APPLY=true
    break
  fi
done

if [[ "$SHOULD_APPLY" == "true" ]]; then
  echo "✅ Grade $GRADE — Launching auto-apply..."
  echo ""
  node auto-apply.mjs "$JOB_URL"
else
  echo "⏭️  Grade ${GRADE:-unknown} — Not auto-applying."
  echo ""
  echo "To apply anyway run:"
  echo "  node auto-apply.mjs \"$JOB_URL\""
fi