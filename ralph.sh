#!/usr/bin/env bash
set -euo pipefail

MAX_ITERATIONS=${1:-15}
ITERATION=0
DONE_MARKER="RALPH_STATUS:done"
LOG_FILE="ralph.log"
# Supported engines (set RALPH_ENGINE):
#   gemini  — gemini CLI with --yolo (default)
#   amp     — amp CLI with --execute --dangerously-allow-all
#   opencode — opencode run (free Kimi model)
MODEL="${RALPH_MODEL:-gemini-2.5-pro}"
ENGINE="${RALPH_ENGINE:-gemini}"

PROMPT='You are building "gist.mom" — a collaborative GitHub Gist editor. Read PLAN.md for full architecture and CLAUDE.md for project rules.

Rules:
- Read TODO.md for current tasks. Work on the highest-priority incomplete item (unchecked [ ]).
- After completing a task, mark it [x] in TODO.md.
- Run `bun run test:e2e` after changes to verify things work. If tests fail, fix them before moving on.
- Commit your progress with a descriptive message after each completed task.
- If ALL tasks are complete, output exactly on its own line: RALPH_STATUS:done
- If you cannot complete a task, document what blocks it in TODO.md and move to the next.
- Keep code simple. Minimal abstractions.
- Do NOT deploy. Do NOT push to remote.'

echo "=== gist.mom Ralph Loop ===" | tee "$LOG_FILE"
echo "Engine: $ENGINE | Model: $MODEL | Max: $MAX_ITERATIONS" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    echo "--- Iteration $ITERATION/$MAX_ITERATIONS ($(date '+%H:%M:%S')) ---" | tee -a "$LOG_FILE"

    ITER_LOG=$(mktemp)
    case "$ENGINE" in
      gemini)
        gemini -m "$MODEL" --yolo "$PROMPT" 2>&1 | tee "$ITER_LOG" || true
        ;;
      amp)
        amp --dangerously-allow-all -x "$PROMPT" 2>&1 | tee "$ITER_LOG" || true
        ;;
      opencode)
        opencode run "$PROMPT" 2>&1 | tee "$ITER_LOG" || true
        ;;
      *)
        echo "Unknown engine: $ENGINE" >&2; exit 1
        ;;
    esac
    OUTPUT=$(cat "$ITER_LOG")
    cat "$ITER_LOG" >> "$LOG_FILE"
    rm -f "$ITER_LOG"
    echo ""

    # Git checkpoint
    if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null || [ -n "$(git ls-files --others --exclude-standard)" ]; then
        git add -A
        git commit -m "ralph: checkpoint iteration $ITERATION" --no-verify 2>/dev/null || true
    else
        echo "[ralph] No uncommitted changes." | tee -a "$LOG_FILE"
    fi

    # Check completion
    if echo "$OUTPUT" | grep -q "$DONE_MARKER"; then
        echo "=== Ralph complete after $ITERATION iterations ===" | tee -a "$LOG_FILE"
        exit 0
    fi

    echo "[ralph] Not done yet. Continuing..." | tee -a "$LOG_FILE"
    echo ""
done

echo "=== Ralph hit max iterations ($MAX_ITERATIONS) ===" | tee -a "$LOG_FILE"
exit 1
