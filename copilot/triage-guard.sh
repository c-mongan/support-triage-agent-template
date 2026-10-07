#!/usr/bin/env bash
# Copilot CLI plugin hook. Once a session runs /triage, enforce the read-only
# workflow for the rest of that session, so it does not rely on --deny-tool:
#   - shell tools are denied;
#   - file-write tools (create, edit, apply_patch, ...) may only write under
#     <cwd>/reports/.
#   triage-guard.sh prompt  # userPromptSubmitted: mark sessions that invoke /triage
#   triage-guard.sh tool    # preToolUse: enforce the rules in marked sessions
# Other sessions are untouched. Zero dependencies beyond bash, sed and grep.
set -u
in="$(tr -d '\n')"
field() { printf '%s' "$in" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -n 1; }
sid="$(field sessionId | tr -cd 'A-Za-z0-9_.-')"
[ -n "$sid" ] || exit 0
dir="${COPILOT_PLUGIN_DATA:-${PLUGIN_DATA:-${TMPDIR:-/tmp}/support-triage-agent}}/triage-sessions"

deny() {
  local msg
  msg="$(printf '%s' "$1" | tr -d '"\\' | tr -cd '[:print:]')"
  printf '{"permissionDecision":"deny","permissionDecisionReason":"support-triage-agent: this session ran /triage, which is read-only. %s Start a new session for other work."}\n' "$msg"
  exit 0
}

# True when $1 (absolute or relative to the session cwd) is inside <cwd>/reports/.
in_reports() {
  local p="$1" cwd
  cwd="$(field cwd)"
  [ -n "$p" ] || return 1
  # A backslash means an escaped character cut the parsed value short; refuse rather than guess.
  case "$p" in *\\*) return 1 ;; esac
  p="${p#./}"
  case "/$p/" in */../*|*/./*) return 1 ;; esac
  if [ "${p#/}" != "$p" ]; then
    [ -n "$cwd" ] || return 1
    p="${p#"${cwd%/}"/}"
    [ "${p#/}" = "$p" ] || return 1
  fi
  case "$p" in reports/?*) return 0 ;; *) return 1 ;; esac
}

case "${1:-}" in
  prompt)
    prompt="$(field prompt | sed 's/^[[:space:]]*//')"
    # field() retains JSON whitespace escapes, so accept those delimiters too.
    triage_command='^/(support-triage-agent:)?triage([[:space:]]|\\[tnr]|$)'
    if [[ "$prompt" =~ $triage_command ]]; then
      mkdir -p "$dir" && : > "$dir/$sid"
    fi
    ;;
  tool)
    [ -f "$dir/$sid" ] || exit 0
    case "$(field toolName)" in
      bash|powershell|shell|*_bash|*_powershell)
        deny "The plugin blocks shell commands. Use the read, search and web tools, and save reports with the file-create tool under reports/."
        ;;
      apply_patch|*_apply_patch)
        # Each target runs to the next JSON newline escape; any other escape stays in the path and is refused.
        files="$(printf '%s' "$in" | grep -oE '\*\*\* (Add|Update|Delete) File: ([^"\\]|\\[^nr])+|\*\*\* Move to: ([^"\\]|\\[^nr])+' | sed -E 's/^\*\*\* (Add |Update |Delete )?(File|Move to): //')"
        [ -n "$files" ] || deny "The plugin could not read the patch targets, so it blocks the patch."
        while IFS= read -r f; do
          in_reports "$f" || deny "The plugin only allows writes under reports/ (blocked: $f)."
        done <<< "$files"
        ;;
      create|edit|write|str_replace|str_replace_editor|insert|undo_edit|*_create|*_edit|*_write)
        p="$(field path)"
        in_reports "$p" || deny "The plugin only allows writes under reports/ (blocked: ${p:-unknown path})."
        ;;
    esac
    ;;
esac
exit 0
