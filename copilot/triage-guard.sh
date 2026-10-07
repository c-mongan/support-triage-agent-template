#!/usr/bin/env bash
# Copilot CLI plugin hook. Once a session runs /triage, block shell tools for the
# rest of that session, so the read-only workflow does not rely on --deny-tool.
#   triage-guard.sh prompt  # userPromptSubmitted: mark sessions that invoke /triage
#   triage-guard.sh tool    # preToolUse: deny bash/powershell in marked sessions
# Other sessions are untouched. Zero dependencies beyond bash and sed.
set -u
in="$(tr -d '\n')"
field() { printf '%s' "$in" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -n 1; }
sid="$(field sessionId | tr -cd 'A-Za-z0-9_.-')"
[ -n "$sid" ] || exit 0
dir="${COPILOT_PLUGIN_DATA:-${PLUGIN_DATA:-${TMPDIR:-/tmp}/support-triage-agent}}/triage-sessions"
case "${1:-}" in
  prompt)
    prompt="$(field prompt | sed 's/^[[:space:]]*//')"
    case "$prompt" in
      /triage*|/support-triage-agent:triage*) mkdir -p "$dir" && : > "$dir/$sid" ;;
    esac
    ;;
  tool)
    case "$(field toolName)" in
      bash|powershell|shell|*_bash|*_powershell)
        if [ -f "$dir/$sid" ]; then
          printf '%s\n' '{"permissionDecision":"deny","permissionDecisionReason":"support-triage-agent: this session ran /triage, which is read-only, so the plugin blocks shell commands for the rest of the session. Use the read, search and web tools, and save reports with the file-create tool under reports/. Start a new session to use the shell."}'
        fi
        ;;
    esac
    ;;
esac
exit 0
