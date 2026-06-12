#!/bin/bash
set -e

# --- daemon supervisor ---
#
# We run two long-lived processes inside this container:
#
#   1. simplex-chat — the SimpleX terminal client in bot mode, listening for
#      WebSocket connections on 127.0.0.1:5226 (container-local).
#   2. websocat — translates external WebSocket connections on
#      0.0.0.0:5225 into local connections to simplex-chat.
#
# If either process exits unexpectedly, the service is broken: a dead
# simplex-chat with a live websocat is an especially nasty silent failure
# (the port still listens, the StartOS port-listening health check stays
# green, but every command times out). So this script supervises both — if
# either child dies, we kill the other and exit non-zero so StartOS restarts
# the container.
#
# Note: --create-bot-display-name and --create-bot-allow-files only take
# effect on the very first start, when no profile exists yet. After that,
# the bot's display name and file-sharing setting live on its persisted
# profile and are edited through the StartOS "Configure" action.

SIMPLEX_PID=""
WEBSOCAT_PID=""

cleanup() {
  # Best-effort: kill both children. The `|| true` keeps trap-on-EXIT quiet
  # when the children are already gone (which is the common case here,
  # since we get to cleanup() via `wait -n` returning).
  [ -n "$SIMPLEX_PID" ]  && kill "$SIMPLEX_PID"  2>/dev/null || true
  [ -n "$WEBSOCAT_PID" ] && kill "$WEBSOCAT_PID" 2>/dev/null || true
}
trap cleanup TERM INT EXIT

# File exchange contract paths (docs/file-exchange-architecture.md §3):
# received files and in-progress transfers land under /simplex/* so that
# consumer packages mounting the same volume subpaths at the same
# mountpoints can use these paths verbatim. /simplex is a single mount;
# inbound and tmp must be plain subdirectories of it so simplex-chat's
# tmp→inbound rename stays on one filesystem.
mkdir -p /simplex/inbound /simplex/tmp /simplex/outbound

/usr/local/bin/simplex-chat \
  -p 5226 \
  --create-bot-display-name "SimpleX Bot" \
  --create-bot-allow-files \
  --files-folder /simplex/inbound \
  --temp-folder /simplex/tmp \
  &
SIMPLEX_PID=$!

# Wait for simplex-chat to actually be listening on its TCP control port
# before we start the bridge. /dev/tcp is a bash builtin — it opens a TCP
# connection (or fails) without needing curl/nc. 60 seconds gives slow
# disks and large profile databases plenty of headroom on first start.
for _ in $(seq 1 60); do
  if (exec 3<>/dev/tcp/127.0.0.1/5226) 2>/dev/null; then
    break
  fi
  sleep 1
done
if ! (exec 3<>/dev/tcp/127.0.0.1/5226) 2>/dev/null; then
  echo "simplex-chat failed to open 127.0.0.1:5226 within 60s" >&2
  exit 1
fi

# WebSocket bridge: external clients (and the StartOS actions, via the
# container IP) connect here. websocat translates each incoming connection
# on :5225 into an outgoing WebSocket to the bot's TCP control port.
/usr/local/bin/websocat -t ws-listen:0.0.0.0:5225 ws://127.0.0.1:5226 &
WEBSOCAT_PID=$!

# Block until either child exits, then propagate. Requires bash 4.3+.
# Capture the exit code via `||` so `set -e` doesn't short-circuit our
# diagnostic before it runs.
EXIT_CODE=0
wait -n || EXIT_CODE=$?
echo "supervised child exited with $EXIT_CODE — shutting down container" >&2
exit "$EXIT_CODE"
