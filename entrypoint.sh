#!/bin/bash
set -e

mkdir -p /data/.simplex
LOG_FILE=/data/.simplex/bot.log

# Run the bot in the background. All output goes to the log file for
# diagnostics — `bot.log` is also useful for users debugging weird behavior.
#
# Note: --create-bot-display-name and --create-bot-allow-files only take
# effect on the very first start, when no profile exists yet. After that,
# the bot's display name and file-sharing setting live on its persisted
# profile and are edited through the StartOS "Configure" action (which talks
# to the running bot over its WebSocket protocol).
/usr/local/bin/simplex-chat \
  -p 5226 \
  --create-bot-display-name "SimpleX Bot" \
  --create-bot-allow-files \
  >"$LOG_FILE" 2>&1 &

# Wait for simplex-chat to actually be listening on its TCP control port
# before we start the bridge. /dev/tcp is a bash builtin — it opens a TCP
# connection (or fails) without needing curl/nc.
for _ in $(seq 1 30); do
  if (exec 3<>/dev/tcp/127.0.0.1/5226) 2>/dev/null; then
    break
  fi
  sleep 1
done

# WebSocket bridge: external clients (and the StartOS actions, via the
# container IP) connect here. websocat translates each incoming connection
# on :5225 into an outgoing WebSocket to the bot's TCP control port on :5226.
exec /usr/local/bin/websocat -t ws-listen:0.0.0.0:5225 ws://127.0.0.1:5226
