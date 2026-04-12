#!/usr/bin/env bash
# Test that Ollama is running and responding correctly

echo "=== Testing Ollama connection ==="
echo ""

# 1. Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "❌ ERROR: Ollama is not running!"
  echo "   Start it with: ollama serve"
  exit 1
fi
echo "✅ Ollama is running"

# 2. Check if qwen3-coder model exists
MODEL_CHECK=$(curl -s http://localhost:11434/api/tags | python3 -c "
import sys, json
data = json.load(sys.stdin)
models = [m['name'] for m in data.get('models', [])]
print('\n'.join(models))
")

echo ""
echo "Available models:"
echo "$MODEL_CHECK"
echo ""

if echo "$MODEL_CHECK" | grep -q "qwen"; then
  echo "✅ Qwen model found"
else
  echo "⚠️  WARNING: No 'qwen' model found. Run: ollama pull qwen2.5-coder:7b"
fi

# 3. Test a simple prompt
echo ""
echo "=== Testing response (this takes 10-30 seconds) ==="
RESPONSE=$(./ollama-run.sh "Say exactly: OLLAMA_OK")
if echo "$RESPONSE" | grep -q "OLLAMA_OK"; then
  echo "✅ Ollama responding correctly"
else
  echo "⚠️  Response received but unexpected format:"
  echo "$RESPONSE" | head -5
fi

echo ""
echo "=== Test complete ==="