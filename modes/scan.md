# Mode: scan — Portal Scanner (Job Discovery)

Scans configured job portals, filters by relevance, and adds new job opportunities to the pipeline for evaluation.

---

## Recommended Execution

Run as a sub-agent to avoid consuming main context:

```
Agent(
   subagent_type="general-purpose",
   prompt="[content of this file + runtime inputs]",
   run_in_background=True
)
```

---

## Configuration

Reads from `portals.yml`:

- `search_queries`: WebSearch queries with `site:` filters
- `tracked_companies`: Companies with `careers_url`
- `title_filter`: Positive/negative keywords and seniority boosts

---

## Discovery Strategy (3 Levels)

### Level 1 — Direct Playwright (PRIMARY)

For each company in `tracked_companies`:

- Navigate to `careers_url` using Playwright
- Extract ALL job listings (title + URL)
- Traverse pagination and filters if present

Advantages:
- Real-time data
- Works with SPAs (Ashby, Lever, Workday)
- Finds fresh postings instantly

---

### Level 2 — Greenhouse API (SUPPLEMENTAL)

For companies with `api`:

- Fetch structured JSON job listings
- Faster and cleaner than scraping

---

### Level 3 — WebSearch Queries (BROAD DISCOVERY)

- Execute all enabled `search_queries`
- Extract `{title, url, company}`

Use for:
- Discovering new companies
- Expanding beyond tracked companies

---

## Execution Priority

1. Playwright (tracked companies)
2. API (if available)
3. WebSearch queries

Merge all results and deduplicate.

---

## Backend-Focused Relevance Bias (CRITICAL)

### Prioritize Roles:

- Software Engineer
- Backend Engineer
- Java Developer / Engineer
- Software Development Engineer (SDE)
- Platform Engineer

### Boost If Title Includes:

- Java
- Spring Boot
- AWS
- Microservices
- Distributed Systems

### Deprioritize:

- AI/ML roles
- Product Manager roles
- Frontend-only roles
- Embedded / C++ / firmware roles

---

## Workflow

### 1. Load Configuration
- Read `portals.yml`

### 2. Load History
- `data/scan-history.tsv`
- `data/applications.md`
- `data/pipeline.md`

---

### 3. Level 1 — Playwright Scan

For each tracked company:

- Navigate to `careers_url`
- Extract job listings
- Handle pagination
- Collect `{title, url, company}`

Fallback:
- If URL fails → use `scan_query`

---

### 4. Level 2 — API Scan

For each company with API:

- Fetch job list JSON
- Extract `{title, url, company}`

---

### 5. Level 3 — WebSearch

For each query:

- Run WebSearch
- Extract:
  - title
  - url
  - company

---

## Title & Company Extraction

Formats:
- "Software Engineer @ Amazon"
- "Backend Engineer | Stripe"
- "Java Developer at Uber"

Regex: `(.+?)(?:\s*[@|—–-]\s*|\s+at\s+)(.+?)$`

## Private URLs

If a URL is not publicly accessible:

1. Save the job description (JD) to:
   `jds/{company}-{role-slug}.md`

2. Add it to `pipeline.md` as:
   `- [ ] local:jds/{company}-{role-slug}.md | {company} | {title}`

---

## Scan History

`data/scan-history.tsv` tracks ALL URLs that have been seen:
```
url	first_seen	portal	title	company	status
https://...	2026-02-10	Ashby — AI PM	PM AI	Acme	added
https://...	2026-02-10	Greenhouse — SA	Junior Dev	BigCo	skipped_title
https://...	2026-02-10	Ashby — AI PM	SA AI	OldCo	skipped_dup
```


---

## Output Summary

```
Portal Scan — {YYYY-MM-DD}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Queries executed: N
Jobs found: N total
Filtered by title: N relevant
Duplicates: N (already evaluated or in pipeline)
New jobs added to pipeline.md: N

  + {company} | {title} | {query_name}
  ...
→ Run /career-ops pipeline to evaluate the new jobs.
```


---

## careers_url Management

Each company in `tracked_companies` must have a `careers_url` — the direct URL to its job listings page. This avoids searching for it repeatedly.

### Known platform patterns:

- Ashby: `https://jobs.ashbyhq.com/{slug}`
- Greenhouse: `https://job-boards.greenhouse.io/{slug}` or `https://job-boards.eu.greenhouse.io/{slug}`
- Lever: `https://jobs.lever.co/{slug}`
- Custom: Company-specific careers page (e.g., `https://openai.com/careers`)

---

### If `careers_url` does NOT exist:

1. Try the known platform pattern  
2. If it fails, run a quick WebSearch:
   `"{company}" careers jobs`
3. Validate the page using Playwright  
4. **Save the discovered URL in `portals.yml`** for future scans  

---

### If `careers_url` returns 404 or redirects:

1. Log it in the output summary  
2. Use `scan_query` as a fallback  
3. Mark it for manual update  

---

## portals.yml Maintenance

- **ALWAYS save `careers_url`** when adding a new company  
- Add new queries as you discover useful portals or roles  
- Disable noisy queries using `enabled: false`  
- Adjust filtering keywords as your target roles evolve  
- Add companies to `tracked_companies` when you want to track them closely  
- Periodically verify `careers_url` — companies often change ATS platforms  