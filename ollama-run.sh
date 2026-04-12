#!/usr/bin/env bash
# ============================================================
# ollama-run.sh — Drop-in replacement for `claude -p`
# Uses Ollama + Qwen 3 Coder instead of Claude Code
#
# Usage: ./ollama-run.sh "your prompt here"
#        ./ollama-run.sh --append-system-prompt-file prompt.md "your prompt"
#
# This script mimics the flags that batch-runner.sh uses so
# you don't need to rewrite batch-runner.sh at all.
# ============================================================

set -euo pipefail

# CHANGE TO THIS:
MODEL="${OLLAMA_MODEL:-qwen3.5:latest}"    # Change this if your model name is different
OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
SYSTEM_PROMPT_FILE=""
PROMPT_TEXT=""

# ---- Parse arguments (mimic claude -p flags) ---------------
# We silently ignore flags we don't need (like --dangerously-skip-permissions)
while [[ $# -gt 0 ]]; do
  case "$1" in
    --append-system-prompt-file)
      SYSTEM_PROMPT_FILE="$2"
      shift 2
      ;;
    --dangerously-skip-permissions)
      shift  # ignored — Ollama doesn't need this
      ;;
    -p)
      shift  # ignored — this is just how claude CLI works
      ;;
    --*)
      # Skip unknown flags and their values
      shift
      if [[ $# -gt 0 && ! "$1" =~ ^-- ]]; then shift; fi
      ;;
    *)
      # Everything that's not a flag is the prompt text
      PROMPT_TEXT="$1"
      shift
      ;;
  esac
done

# ---- Build the full prompt ----------------------------------
FULL_PROMPT=""

# If a system prompt file was given, prepend it
if [[ -n "$SYSTEM_PROMPT_FILE" && -f "$SYSTEM_PROMPT_FILE" ]]; then
  SYSTEM_CONTENT=$(cat "$SYSTEM_PROMPT_FILE")
  FULL_PROMPT="${SYSTEM_CONTENT}

---

${PROMPT_TEXT}"
else
  FULL_PROMPT="$PROMPT_TEXT"
fi

# ---- Escape for JSON ----------------------------------------
# This safely escapes the prompt so it can go into a JSON body
ESCAPED_PROMPT=$(printf '%s' "$FULL_PROMPT" | python3 -c "
import sys, json
text = sys.stdin.read()
print(json.dumps(text))
")

# ---- Call Ollama API ----------------------------------------
RESPONSE=$(curl -s "${OLLAMA_URL}/api/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"${MODEL}\",
    \"prompt\": ${ESCAPED_PROMPT},
    \"stream\": false,
    \"options\": {
      \"temperature\": 0.3,
      \"num_ctx\": 32768
    }
  }")

# ---- Extract and print the response text --------------------
echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('response', ''))
except Exception as e:
    print('ERROR: Failed to parse Ollama response:', e, file=sys.stderr)
    sys.exit(1)
"