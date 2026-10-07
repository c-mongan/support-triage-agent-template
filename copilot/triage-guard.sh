#!/usr/bin/env bash
# Copilot CLI plugin hook. Once a session runs /triage, enforce the read-only
# workflow for the rest of that session, so it does not rely on --deny-tool:
#   - shell tools are denied;
#   - file-write tools (create, edit, apply_patch, ...) may only write under
#     <cwd>/reports/, with no symlinked or hard-linked component on the way;
#   - MCP tools are denied unless their verb is read-only (get, list, search, ...);
#   - sub-agents may only be the plugin's own agent, and each one it starts is
#     marked as a /triage session too, so the same rules apply inside it.
#   triage-guard.sh prompt  # userPromptSubmitted: mark /triage sessions and their sub-agents
#   triage-guard.sh tool    # preToolUse: enforce the rules in marked sessions
# Other sessions are untouched. Zero dependencies beyond bash, sed, grep, find and cksum.
set -u
in="$(tr -d '\n')"
# Raw JSON string values of key $1, in document order, with escapes left in place.
raw_all() { printf '%s' "$in" | grep -oE "\"$1\"[[:space:]]*:[[:space:]]*\"([^\"\\\\]|\\\\.)*\"" | sed -E "s/^\"$1\"[[:space:]]*:[[:space:]]*\"//; s/\"\$//"; }
field() { raw_all "$1" | head -n 1; }
sid="$(field sessionId | tr -cd 'A-Za-z0-9_.-')"
[ -n "$sid" ] || exit 0
dir="${COPILOT_PLUGIN_DATA:-${PLUGIN_DATA:-${TMPDIR:-/tmp}/support-triage-agent}}/triage-sessions"
cwd="$(field cwd)"
[ -n "$cwd" ] || cwd="$PWD"
cwd="${cwd%/}"

deny() {
  local msg
  msg="$(printf '%s' "$1" | tr -d '"\\' | tr -cd '[:print:]')"
  printf '{"permissionDecision":"deny","permissionDecisionReason":"support-triage-agent: this session ran /triage, which is read-only. %s Start a new session for other work."}\n' "$msg"
  exit 0
}

# Sub-agent sessions are linked to their parent by the prompt the parent passed to the task tool.
prompt_key() { printf '%s' "$1" | cksum | tr -c '0-9\n' '-' | cut -d- -f1-2; }

# True when $1 (absolute or relative to the session cwd) is inside <cwd>/reports/
# and nothing between <cwd> and the target is a symlink or a hard-linked file.
in_reports() {
  local p="$1" abs cur
  [ -n "$p" ] || return 1
  # A backslash is a JSON escape; refuse rather than guess what it decodes to.
  case "$p" in *\\*) return 1 ;; esac
  p="${p#./}"
  case "/$p/" in */../*|*/./*) return 1 ;; esac
  case "$cwd" in /*) ;; *) return 1 ;; esac
  if [ "${p#/}" != "$p" ]; then
    abs="$p"
    p="${p#"$cwd"/}"
    [ "${p#/}" = "$p" ] || return 1
  else
    abs="$cwd/$p"
  fi
  case "$p" in reports/?*) ;; *) return 1 ;; esac
  # Following a symlink (reports/archive -> ../tickets) or a hard link would land outside reports/.
  [ -f "$abs" ] && [ -n "$(find "$abs" -maxdepth 0 -links +1 2>/dev/null)" ] && return 1
  cur="${abs%/}"
  while [ "$cur" != "$cwd" ] && [ -n "$cur" ] && [ "$cur" != / ]; do
    [ -L "$cur" ] && return 1
    cur="$(dirname "$cur")"
  done
  return 0
}

# Read-only MCP verbs. Anything else from an MCP server (create, update, post, send, ...) is denied.
mcp_read_only() {
  local name="$1" tool
  case "$name" in
    *-resolve-library-id|*-get-library-docs|*-query-docs) return 0 ;;
  esac
  tool="${name##*-}"; tool="${tool##*__}"
  case "$tool" in
    get_*|list_*|search_*|read_*|fetch_*|query_*|describe_*|find_*|lookup_*|show_*|view_*|retrieve_*|ask_question|get|list|search|read|fetch) return 0 ;;
  esac
  return 1
}

case "${1:-}" in
  prompt)
    prompt="$(field prompt)"
    key="$(prompt_key "$prompt")"
    prompt="$(printf '%s' "$prompt" | sed 's/^[[:space:]]*//')"
    # Raw JSON keeps whitespace escapes, so accept those delimiters too.
    triage_command='^/(support-triage-agent:)?triage([[:space:]]|\\[tnr]|$)'
    if [[ "$prompt" =~ $triage_command ]]; then
      mkdir -p "$dir" && : > "$dir/$sid"
    elif [ -f "$dir/pending-$key" ]; then
      rm -f "$dir/pending-$key"
      mkdir -p "$dir" && : > "$dir/$sid"
    fi
    ;;
  tool)
    [ -f "$dir/$sid" ] || exit 0
    name="$(field toolName)"
    case "$name" in
      bash|powershell|shell|*_bash|*_powershell)
        deny "The plugin blocks shell commands. Use the read, search and web tools, and save reports with the file-create tool under reports/."
        ;;
      task|agent|*_task|create_session)
        case "$(field agent_type)" in
          support-triage-agent|*:support-triage-agent) ;;
          *) deny "The plugin only allows its own support-triage-agent as a sub-agent." ;;
        esac
        p="$(field prompt)"
        [ -n "$p" ] || deny "The plugin could not read the sub-agent prompt, so it blocks the sub-agent."
        mkdir -p "$dir" && : > "$dir/pending-$(prompt_key "$p")"
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
        # Every path-like argument must be inside reports/, so a nested or repeated key cannot smuggle a target.
        paths="$( { raw_all path; raw_all file_path; raw_all filePath; raw_all target; raw_all destination; } )"
        [ -n "$paths" ] || deny "The plugin only allows writes under reports/ (blocked: unknown path)."
        while IFS= read -r f; do
          in_reports "$f" || deny "The plugin only allows writes under reports/ (blocked: $f)."
        done <<< "$paths"
        ;;
      *-*|mcp__*)
        mcp_read_only "$name" || deny "The plugin only allows read-only MCP tools (get, list, search, read, fetch, query) during triage (blocked: $name)."
        ;;
    esac
    ;;
esac
exit 0
