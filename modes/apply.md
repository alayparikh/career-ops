# Mode: apply — Live Application Assistant

Interactive mode for when the candidate is filling out an application form in Chrome. Reads what's on screen, loads previous context from the offer, and generates personalized responses for each form question.

## Requirements

- **Better with visible Playwright**: In visible mode, the candidate sees the browser and Claude can interact with the page.
- **Without Playwright**: the candidate shares a screenshot or pastes the questions manually.

## Workflow

```
1. DETECT    → Read active Chrome tab (screenshot/URL/title)
2. IDENTIFY  → Extract company + role from the page
3. SEARCH    → Match against existing reports in reports/
4. LOAD      → Read full report + Section G (if exists)
5. COMPARE   → Does the role on screen match the evaluated one? If changed → notify
6. ANALYZE   → Identify ALL visible form questions
7. GENERATE  → For each question, generate personalized response
8. PRESENT   → Show formatted responses for copy-paste
```

## Step 1 — Detect the offer

**With Playwright:** Take a snapshot of the active page. Read title, URL, and visible content.

**Without Playwright:** Ask the candidate to:
- Share a screenshot of the form (Read tool reads images)
- Or paste the form questions as text
- Or state company + role so we can search

## Step 2 — Identify and search context

1. Extract company name and role title from the page
2. Search in `reports/` by company name (case-insensitive grep)
3. If match → load the full report
4. If Section G exists → load previous draft answers as base
5. If NO match → notify and offer to run quick auto-pipeline

## Step 3 — Detect role changes

If the role on screen differs from the evaluated one:
- **Notify candidate**: "The role has changed from [X] to [Y]. Do you want me to re-evaluate or adapt responses to the new title?"
- **If adapt**: Adjust responses to the new role without re-evaluating
- **If re-evaluate**: Run full A-F evaluation, update report, regenerate Section G
- **Update tracker**: Change role title in applications.md if applicable

## Step 4 — Analyze form questions

Identify ALL visible questions:
- Free text fields (cover letter, why this role, etc.)
- Dropdowns (how did you hear, work authorization, etc.)
- Yes/No (relocation, visa, etc.)
- Salary fields (range, expectation)
- Upload fields (resume, cover letter PDF)

Classify each question:
- **Already answered in Section G** → adapt the existing response
- **New question** → generate response from report + cv.md

## Step 5 — Generate responses

For each question, generate the response following:

1. **Report context**: Use proof points from block B, STAR stories from block F
2. **Previous Section G**: If a draft response exists, use it as base and refine
3. **"I'm choosing you" tone**: Same framework as auto-pipeline
4. **Specificity**: Reference something concrete from the visible JD
5. **career-ops proof point**: Include in "Additional info" if there's a field for it

**Output format:**

```
## Responses for [Company] — [Role]

Based on: Report #NNN | Score: X.X/5 | Archetype: [type]

---

### 1. [Exact form question]
> [Response ready for copy-paste]

### 2. [Next question]
> [Response]

...

---

Notes:
- [Any observations about the role, changes, etc.]
- [Suggestions for personalization the candidate should review]
```

## Step 6 — Post-apply (optional)

If the candidate confirms they submitted the application:
1. Update status in `applications.md` from "Evaluated" to "Applied"
2. Update Section G of the report with final responses
3. Suggest next step: `/career-ops contact` for LinkedIn outreach

## Scroll handling

If the form has more questions than visible:
- Ask candidate to scroll and share another screenshot
- Or paste remaining questions
- Process in iterations until covering the entire form

