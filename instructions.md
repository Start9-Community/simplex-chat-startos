# SimpleX Websocket Bridge

This service has no human chat interface — it is driven entirely by your own software over a Websocket API. For chatting by hand, use the SimpleX mobile or desktop apps.

## Documentation

- [SimpleX bots — sending commands](https://github.com/simplex-chat/simplex-chat/blob/stable/bots/README.md#sending-commands) — how to drive the client over its Websocket.
- [SimpleX CLI command reference](https://github.com/simplex-chat/simplex-chat/blob/stable/docs/CLI.md) — the commands you can send.
- [SimpleX Chat](https://simplex.chat) — about the network this connects to.

## What you get on StartOS

- A **Websocket API** to the SimpleX network, gated by an API key, that your bots, AI agents, scripts, and other StartOS services can drive.
- **Actions** to manage the SimpleX profile, mint one-time invitation links, and manage API keys.
- A **shared-volume file-exchange contract** other StartOS packages can opt into to send and receive files through the bridge.

## Getting set up

1. Start the service.
2. Open the **API Keys** action and copy the key created on install (or add your own). Outside clients send it as `Authorization: Bearer <token>`.
3. Open **Interfaces → Websocket** and copy the URL StartOS publishes for your network (LAN, Tor, etc.).
4. Connect any Websocket client to that URL with the bearer token, then drive it with the SimpleX protocol (see Documentation).
5. To give someone a way to reach the bridge, run the **Create Invitation** action and share the link or QR — they paste it into their SimpleX client.

On-box StartOS services that depend on this package connect directly and do not need an API key.

## Authentication

Outside access to the Websocket API is gated by a bearer token at the StartOS reverse proxy: connect with `Authorization: Bearer <token>` on the Websocket upgrade — requests without a valid token get `401` and never reach the bridge.

Manage tokens in the **API Keys** action — each has a label (to identify the client) and a generated token. Add one per client; delete one to revoke its access.

## Configuring the profile

Open the **Configure Bot Profile** action to view and edit the live profile:

- **Display Name** — the name peers see when they connect.
- **Profile Picture** — a base64 data URL; leave empty to remove the current picture. Small images (< 64KB) render best in SimpleX clients.
- **Allow files & media** — whether contacts can exchange files and media with the bridge.

Submitting pushes the change to the running client immediately — no restart, and no impact on existing contacts or chats.

## Adding a contact

1. Run the **Create Invitation** action. The bridge mints a fresh one-time link and shows it with a QR code.
2. Send the link or QR to the person you want to invite; they paste it into their SimpleX client.

Each link can be redeemed by exactly one peer — run the action again to invite another person.

## Connecting programmatically

The bridge does not accept raw command strings; wrap every command in a small JSON envelope:

```json
{ "corrId": "any-id-you-pick", "cmd": "/help" }
```

- `corrId` is a correlation id you choose; the bridge echoes it back in the matching reply so you can pair requests with responses.
- `cmd` is the SimpleX command, exactly as in the `simplex-chat` CLI (leading slash included).

Each reply is a JSON object with the same `corrId` and a `resp` field. The bridge also pushes unsolicited event messages (without your `corrId`) for incoming chats, contact updates, and the like. A few useful commands: `/user` (the active user), `/_connect 1` (a one-time invitation link for user 1 — what **Create Invitation** does), and `/contacts` (connected peers).

## Resetting

To start over with a fresh identity, run the **Reset Profile** action under Danger Zone (available when the service is stopped). It permanently deletes the SimpleX identity, contacts, and chat history; your API keys are kept. On the next start the bridge boots with a fresh profile.
