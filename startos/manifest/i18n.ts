export const short = 'A WebSocket gateway to the SimpleX messaging network'

export const long =
  'SimpleX Gateway runs a headless SimpleX Chat client and exposes the SimpleX network over a local WebSocket API, so your apps, scripts, bots, and other StartOS services can send and receive SimpleX messages and files programmatically. SimpleX is the first messenger with no user identifiers — not even random numbers — and is fully open source, end-to-end encrypted, and metadata-resistant by design.'

export const installAlert =
  'SimpleX Gateway exposes the SimpleX network over a WebSocket API for your own software to drive — there is no human chat interface here (use the SimpleX mobile or desktop apps for that).\n\n' +
  'To use it: point a WebSocket client at the URL under Interfaces → WebSocket — a bot, an integration like OpenClaw, or your own scripts — and run the "Create Invitation" action to hand a contact a connection link.\n\n' +
  'Outside access requires an API key: open the "API Keys" action to grab the one created on install (or add your own), and send it as Authorization: Bearer <token>. On-box services connect directly and need no key.'
