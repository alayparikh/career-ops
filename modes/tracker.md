# Mode: tracker — Applications Tracker

Reads and displays `data/applications.md`.

**Tracker Format:**
```markdown
| # | Date | Company | Role | Score | Status | PDF | Report |
```

Possible statuses: `Evaluated` → `Applied` → `Responded` → `Contacted` → `Interview` → `Offer` / `Rejected` / `Discarded` / `DO NOT APPLY`

- `Applied` = the candidate sent their application
- `Responded` = A recruiter/company contacted and the candidate responded (inbound)
- `Contacted` = The candidate proactively contacted someone from the company (outbound, e.g., LinkedIn power move)

If the user asks to update a status, edit the corresponding row.

Also show statistics:
- Total applications
- By status
- Average score
- % with PDF generated
- % with report generated

