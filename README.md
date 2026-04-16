# Career-Ops: AI-Powered Job Search Pipeline

## Overview
Career-Ops is an AI-driven job search assistant for REDACTED, a Java Backend Engineer. It evaluates job offers, generates tailored CVs, and tracks applications using local Ollama models. The system reasons carefully about fit between job descriptions and the candidate's profile, ensuring honest assessments without inventing experience.

## Features
- **Job Evaluation**: Score offers across 10 dimensions with a weighted final grade (A-F).
- **CV Generation**: Create ATS-optimized PDFs tailored to specific roles.
- **Job Scanning**: Scan job portals for matching opportunities.
- **Batch Processing**: Handle multiple offers or tasks at once.
- **Application Tracking**: Maintain a tracker of applied jobs.
- **Form-Filling Guidance**: Provide guidance for application forms.
- **LinkedIn Outreach**: Assist with contact strategies.
- **Company Research**: Deep dive into company details.
- **Certification Evaluation**: Assess training and certs for career fit.

## Installation
1. **Install Ollama**: On macOS, run `brew install ollama`.
2. **Pull the Model**: `ollama pull qwen2.5-coder:7b` (or your preferred model).
3. **Install Dependencies**: `npm install` (for Node.js scripts like PDF generation and auto-apply).
4. **Configure Profile**: Edit `config/profile.yml` with your details, preferences, and targets.
5. **Set Up Scripts**: Make scripts executable: `chmod +x ollama-run.sh test-ollama.sh`.

## Usage
Interact via commands prefixed with `/career-ops`. The system reads required files (`cv.md`, `config/profile.yml`, `modes/_shared.md`) before processing.

### Commands
- `/career-ops {URL or JD text}` → Evaluate a single job offer (uses `modes/oferta.md`).
- `/career-ops pdf` → Generate an ATS-optimized CV PDF (uses `modes/pdf.md`).
- `/career-ops scan` → Scan job portals for matches (uses `modes/scan.md`).
- `/career-ops batch` → Batch process multiple items (uses `modes/batch.md`).
- `/career-ops tracker` → Display application status (uses `modes/tracker.md`).
- `/career-ops apply` → Provide form-filling guidance (uses `modes/apply.md`).
- `/career-ops pipeline` → Show pending URLs (uses `modes/pipeline.md`).
- `/career-ops contacto` → LinkedIn outreach tips (uses `modes/contacto.md`).
- `/career-ops deep` → Company research (uses `modes/deep.md`).
- `/career-ops training` → Evaluate certifications (uses `modes/training.md`).

### Running Scripts
- **Evaluate a Job**: `./ollama-run.sh modes/oferta.md cv.md config/profile.yml "Evaluate this job: {URL}"`
- **Test Setup**: `./test-ollama.sh`
- **Generate PDF**: `node generate-pdf.mjs templates/resume.html output/resume.pdf --format=letter`
- **Auto-Apply**: `node auto-apply.mjs {job-url}` (reviews form before submitting).

## Evaluation Scoring
Jobs are scored on 10 dimensions with weights:

| Dimension | Weight | Criteria (1-5) |
|-----------|--------|-----------------|
| Role Match | 25% | Fit for Java Backend / QA / SDE roles |
| Skills Alignment | 20% | Java, Spring Boot, AWS, Microservices match |
| Seniority | 10% | Mid-level (2-5 yrs) |
| Compensation | 10% | Meets $80K minimum |
| Geographic/Visa | 10% | Remote or Atlanta area; sponsorship offered |
| Company Stage | 5% | Stable with revenue |
| PMF/Traction | 5% | Real users/revenue |
| Growth Potential | 5% | Path to advance in 2-3 years |
| Interview Likelihood | 5% | Realistic match |
| Timeline | 5% | Actively hiring now |

**Gate Rule**: If Role Match < 3 or Skills Alignment < 3, final grade = F.

**Grades**:
- A: 4.5–5.0 → Apply immediately
- B: 3.5–4.4 → Strong candidate, apply
- C: 2.5–3.4 → Borderline, apply if no better
- D: 1.5–2.4 → Probably not worth it
- F: <1.5 or gate triggered → Skip

## Report Format
Evaluations output 6 blocks in `reports/NNN-company-role.md`:
1. **Role Summary**: Company, title, location, salary, remote, visa.
2. **CV Match**: Matches and gaps from `cv.md`.
3. **Level & Strategy**: Seniority fit and application angle.
4. **Compensation Research**: Fairness and negotiation notes.
5. **Personalization Notes**: CV tweaks and archetype for PDF.
6. **Interview Prep**: STAR+R stories for likely questions.

Also generates `output/NNN-company-role.pdf` and updates `data/applications.md`.

## Files Structure
- `cv.md` — Full work history and skills (never modify directly).
- `config/profile.yml` — Preferences, visa status, salary targets, archetypes.
- `modes/_shared.md` — Shared scoring rules and framing.
- `modes/` — Individual mode files (oferta.md, ofertas.md, etc.).
- `reports/` — Evaluation reports.
- `output/` — Generated PDFs and resumes.
- `data/applications.md` — Application tracker.
- `templates/` — HTML templates for PDFs.
- `scripts/` — Utility scripts.

## Hard Rules
- Never invent experience or apply on behalf of the user.
- Always check for duplicates in `data/applications.md`.
- Mention visa/sponsorship in evaluations.
- Use archetypes from `_shared.md` for tailoring.

## Contributing
This is a personal tool for REDACTED. Fork for your own use, but adapt to your profile.

## License
MIT License.
