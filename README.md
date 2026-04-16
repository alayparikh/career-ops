# Career-Ops: AI-Powered Job Search Pipeline

## Overview
Career-Ops is an AI-driven job search assistant for a Java Backend Engineer profile. It evaluates job offers, generates tailored CVs, and tracks applications using local Ollama models. The system reasons carefully about fit between job descriptions and the candidate's profile, ensuring honest assessments without inventing experience.

## Features
- Job evaluation across weighted dimensions with a final grade
- ATS-optimized CV/PDF generation tailored to specific roles
- Job portal scanning and batch processing
- Application tracking and report generation
- Form-filling guidance and outreach support
- Company research and certification evaluation

## Installation
1. Install Ollama: `brew install ollama`
2. Pull the model: `ollama pull qwen2.5-coder:7b`
3. Install dependencies: `npm install`
4. Configure profile: edit `config/profile.yml`
5. Make scripts executable: `chmod +x ollama-run.sh test-ollama.sh`

## Usage
The system reads required files (`cv.md`, `config/profile.yml`, `modes/_shared.md`) before processing.

### Commands
- `/career-ops {URL or JD text}` → Evaluate a single job offer (`modes/oferta.md`)
- `/career-ops pdf` → Generate an ATS-optimized CV PDF (`modes/pdf.md`)
- `/career-ops scan` → Scan job portals for matches (`modes/scan.md`)
- `/career-ops batch` → Batch process multiple items (`modes/batch.md`)
- `/career-ops tracker` → Display application status (`modes/tracker.md`)
- `/career-ops apply` → Provide form-filling guidance (`modes/apply.md`)
- `/career-ops pipeline` → Show pending URLs (`modes/pipeline.md`)
- `/career-ops deep` → Company research (`modes/deep.md`)
- `/career-ops training` → Evaluate certifications (`modes/training.md`)

### Running Scripts
- Evaluate a job:
  `./ollama-run.sh modes/oferta.md cv.md config/profile.yml "Evaluate this job: {URL}"`
- Test setup:
  `./test-ollama.sh`
- Generate PDF:
  `node generate-pdf.mjs templates/resume.html output/resume.pdf --format=letter`
- Auto-apply:
  `node auto-apply.mjs {job-url}`

## Evaluation Scoring
Jobs are scored on 10 dimensions with weighted criteria:
- Role Match
- Skills Alignment
- Seniority
- Compensation
- Geographic/Visa
- Company Stage
- PMF/Traction
- Growth Potential
- Interview Likelihood
- Timeline

Gate rule: if Role Match < 3 or Skills Alignment < 3, final grade = F.

## Report Format
Evaluations output 6 blocks in `reports/NNN-company-role.md`:
1. Role Summary
2. CV Match
3. Level & Strategy
4. Compensation Research
5. Personalization Notes
6. Interview Prep

Also generates `output/NNN-company-role.pdf` and updates `data/applications.md`.

## Files Structure
- `cv.md` — candidate work history and skills
- `config/profile.yml` — profile preferences and settings
- `modes/_shared.md` — shared scoring rules
- `modes/` — workflow mode files
- `reports/` — evaluation reports
- `output/` — generated PDFs
- `data/applications.md` — application tracker
- `templates/` — PDF templates
- `scripts/` — utility scripts

## Hard Rules
- Never invent experience or apply on behalf of the user
- Always check for duplicates in `data/applications.md`
- Mention visa/sponsorship in evaluations
- Use archetypes from `_shared.md` for tailoring
