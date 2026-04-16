# Mode: offer — Complete A-F Evaluation

When the candidate pastes an offer (text or URL), ALWAYS deliver the 6 blocks:

## Step 0 — Archetype Detection

Classify the offer into one of the 5 archetypes defined in `_shared.md`:
- Backend Software Engineer
- Java Engineer
- Software Development Engineer (SDE)
- Platform Engineer
- Site Reliability Engineer (SRE)

If it's hybrid, indicate the 2 closest ones. This determines:
- Which proof points to prioritize in block B
- How to rewrite the summary in block E
- Which STAR stories to prepare in block F

## Block A — Role Summary

Table with:
- Detected archetype
- Domain (backend/distributed-systems/platform/cloud/reliability)
- Function (build/design/maintain/optimize)
- Seniority
- Remote (full/hybrid/onsite)
- Team size (if mentioned)
- TL;DR in 1 sentence

## Block B — CV Match

Read `cv.md`. Create a table mapping each JD requirement to exact lines from the CV.

**Adapted to the archetype (from `_shared.md`):**
- If Backend Engineer → prioritize scalable microservices, API design, system performance
- If Java Engineer → prioritize Spring Boot, backend services, production Java systems
- If SDE → prioritize problem-solving, coding efficiency, system design
- If Platform Engineer → prioritize CI/CD pipelines, DevOps, deployment automation
- If SRE → prioritize monitoring, incident response, debugging, reliability improvements

**Always include in every evaluation:**
- Java / Spring Boot evidence
- AWS services used (SNS, SQS, Lambda, RDS, EC2)
- System scale signals (e.g. "Supported 1,000+ locations")
- Production experience (real systems, not academic projects)

Section of **gaps** with mitigation strategy for each. For each gap:
1. Is it a hard blocker or a nice-to-have?
2. Can the candidate demonstrate adjacent experience?
3. Is there a portfolio project that covers this gap?
4. Concrete mitigation plan (phrase for cover letter, quick project, etc.)

## Block C — Level and Strategy

1. **Detected level** in the JD vs **candidate's natural level for that archetype**
2. **Plan "sell senior without lying"**: specific phrases adapted to the archetype, concrete achievements to highlight. Use the cross-cutting advantage from `_shared.md`: *"Backend engineer with strong distributed systems and production experience"*
3. **Plan "if they downlevel me"**: accept if comp is fair, negotiate review at 6 months, clear promotion criteria

## Block D — Comp and Demand

Use WebSearch for:
- Current salaries for the role (Glassdoor, Levels.fyi, Blind)
- Company's compensation reputation
- Role demand trend

Table with data and cited sources. If no data, say so instead of inventing.

## Block E — Personalization Plan

| # | Section | Current State | Proposed Change | Why |
|---|---------|---------------|-----------------|-----|
| 1 | Summary | ... | ... | ... |
| ... | ... | ... | ... | ... |

**Mandatory keywords to inject in every CV tailoring (from `_shared.md`):**
- Summary must mention: Java, Spring Boot, AWS, microservices, distributed systems
- Skills must include: Java, Spring Boot, REST APIs, AWS (SNS/SQS/Lambda/RDS), PostgreSQL, CI/CD
- Every bullet must prefer impact + scale over task description
  - ✅ "Reduced API latency by 40% across 1,000+ locations"
  - ❌ "Worked on backend APIs"

Top 5 changes to CV + Top 5 changes to LinkedIn to maximize match.

## Block F — Interview Plan

6-10 STAR+R stories mapped to JD requirements (STAR + **Reflection**):

| # | JD Requirement | STAR+R Story | S | T | A | R | Reflection |
|---|----------------|--------------|---|---|---|---|------------|

The **Reflection** column captures what was learned or what would be done differently. This signals seniority — junior candidates describe what happened, senior candidates extract lessons.

**Story Bank:** If `interview-prep/story-bank.md` exists, check if any of these stories are already there. If not, append new ones. Over time this builds a reusable bank of 5-10 master stories that can be adapted to any interview question.

**Selected and framed according to the archetype:**
- FDE → emphasize delivery speed and client-facing
- SA → emphasize architecture decisions
- PM → emphasize discovery and trade-offs
- LLMOps → emphasize metrics, evals, production hardening
- Agentic → emphasize orchestration, error handling, HITL
- Transformation → emphasize adoption, organizational change

Also include:
- 1 recommended case study (which of their projects to present and how)
- Red-flag questions and how to respond (e.g., "Why did you sell your company?", "Do you have a team of reports?")

---

## Post-evaluation

**ALWAYS** after generating blocks A-F:

### 1. Save report .md

Save complete evaluation in `reports/{###}-{company-slug}-{YYYY-MM-DD}.md`.

- `{###}` = next sequential number (3 digits, zero-padded)
- `{company-slug}` = company name in lowercase, no spaces (use hyphens)
- `{YYYY-MM-DD}` = current date

**Report format:**

```markdown
# Evaluation: {Company} — {Role}

**Date:** {YYYY-MM-DD}
**Archetype:** {detected}
**Score:** {X/5}
**PDF:** {path or pending}

---

## A) Role Summary
(full content of block A)

## B) CV Match
(full content of block B)

## C) Level and Strategy
(full content of block C)

## D) Comp and Demand
(full content of block D)

## E) Personalization Plan
(full content of block E)

## F) Interview Plan
(full content of block F)

## G) Draft Application Answers
(only if score >= 4.5 — drafts of answers for the application form)

---

## Extracted Keywords
(list of 15-20 keywords from JD for ATS optimization)
```

### 2. Register in tracker

**ALWAYS** register in `data/applications.md`:
- Next sequential number
- Current date
- Company
- Role
- Score: average match (1-5)
- Status: `Evaluated`
- PDF: ❌ (or ✅ if auto-pipeline generated PDF)
- Report: relative link to the report .md (e.g., `[001](reports/001-company-2026-01-01.md)`)

**Tracker format:**

```markdown
| # | Date | Company | Role | Score | Status | PDF | Report |
```
