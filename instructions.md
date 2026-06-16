# SimpleX Gateway

Welcome! This package runs SimpleX Chat headless and exposes a WebSocket API, so
you can drive it from any client that speaks the SimpleX terminal chat protocol —
a bot, an integration, or your own scripts. There's no human chat UI here; for
human messaging, use the SimpleX mobile or desktop apps.

## Authentication

Outside access to the WebSocket API is gated by a **bearer token** at the StartOS
reverse proxy: connect with `Authorization: Bearer <token>` on the WebSocket
upgrade — requests without a valid token get `401` and never reach the gateway.

Manage tokens in the **API Keys** action — each key has a label (to identify the
client) and a generated token. Add a key per client; delete one to revoke its
access. One key is created automatically on install.

On-box StartOS services (dependents) connect to the gateway directly and do
**not** need a key.

## Configuration

The SimpleX profile is the gateway's configuration — there's no separate
StartOS-side config file. Open the **Configure Bot Profile** action to view and
edit the live profile:

- **Display Name** — the name peers see when they connect.
- **Profile Picture** — a base64 data URL (e.g.
  `data:image/jpg;base64,...`). Leave empty to remove the current picture.
  Small images (< 64KB) render best in SimpleX clients.
- **Allow files & media** — whether contacts can exchange files and media with
  the gateway (on by default).

When you submit, the change is pushed straight to the running client — no
restart, no impact on existing contacts or chats.

## How to add a new contact

1. Start the service.
2. Run the **Create Invitation** action. The gateway creates a fresh
   one-time invitation link and shows it to you with a QR code.
3. Send the link (or QR) to the person you want to invite. They paste it into
   their SimpleX client to connect.

Each link can be redeemed by exactly one peer. To invite another contact, run
the action again to get a new link.

## Connecting programmatically

This package exposes a single **WebSocket** interface. Open this package's UI
in StartOS, look under *Interfaces* → *WebSocket*, and copy the URL — StartOS
gives you the right hostname and port for your network (LAN, Tor, etc.).
Connect any WebSocket client to that URL.

### Command format

The gateway doesn't accept raw command strings over the WebSocket; every command
must be wrapped in a small JSON envelope:

```json
{ "corrId": "any-id-you-pick", "cmd": "/help" }
```

- `corrId` is a correlation id you choose. The gateway echoes it back in the
  matching response so you can pair requests and replies when multiple are in
  flight. Any unique string works.
- `cmd` is the SimpleX terminal command, exactly as you'd type it into the
  `simplex-chat` CLI (leading slash included).

Each reply is a JSON object containing the same `corrId` plus a `resp` field
with the command's result. The gateway may also push unsolicited event messages
(without your `corrId`) — incoming chats, contact updates, etc.

See the upstream
[SimpleX bots — sending commands](https://github.com/simplex-chat/simplex-chat/blob/stable/bots/README.md#sending-commands)
guide for the full protocol, and the
[CLI command reference](https://github.com/simplex-chat/simplex-chat/blob/stable/docs/CLI.md)
for the list of `cmd` values you can send.

### A few useful commands

- `/user` — get the active user.
- `/_connect 1` — create a one-time invitation link for user ID 1 (the same thing the
  *Create Invitation* action does).
- `/contacts` — list peers who have connected.
- `/profile <name>` — change the display name.

Wrapped, those look like:

```json
{ "corrId": "1", "cmd": "/user" }
{ "corrId": "2", "cmd": "/_connect 1" }
{ "corrId": "3", "cmd": "/contacts" }
{ "corrId": "4", "cmd": "/profile <name>" }
```

A response for the first command will look like this:

```json
{
    "corrId": "1",
    "resp": {
        "type": "activeUser",
        "user": {
            "userId": 1,
            "profile": {
                "displayName": "SimpleX Bot"
            }
        }
    }
}
```

## Backups

The SimpleX profile, configuration, and chat history all live in the `main`
volume, which is included in StartOS backups. Restoring a backup brings the
gateway back with its original identity, contacts, and message history.

## Reset

If you ever want to start from a fresh identity, run the **Reset Profile**
action (under *Danger Zone*). The service must be stopped first. The action
deletes the SimpleX identity, all contacts, and all chat history. Once you start
the service again, it boots back up with a fresh profile — you can change the
display name and picture again in *Configure*.

## Where to find things

- **WebSocket URL** — *Interfaces* → *WebSocket* in this package's StartOS UI.
- **Profile (name, picture, file sharing)** — *Configure Bot Profile* action.
- **Invitation links** — *Create Invitation* action (one-time, generated
  on demand).
- **Reset** — *Reset Profile* action.
