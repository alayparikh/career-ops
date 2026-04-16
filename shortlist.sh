#!/usr/bin/env bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏆 TOP JOBS — Grade A and B"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -l "FINAL_GRADE: [AB]" reports/*.md 2>/dev/null | while read f; do
  grade=$(grep -o "FINAL_GRADE: [A-F]" "$f" | head -1)
  company=$(basename "$f" | sed 's/-[0-9]*-[0-9]*-[0-9]*\.md//')
  url=$(grep -o "http[s]*://[^ ]*" "$f" | head -1)
  echo ""
  echo "  $grade | $company"
  echo "  �� $f"
  echo "  🔗 $url"
done
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Run: open reports/<filename>.md  to read full report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
