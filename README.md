# SimpleX Chat for StartOS

A [StartOS](https://start9.com) package that runs the [SimpleX Chat](https://simplex.chat/) terminal client in headless bot mode, exposed over a WebSocket so other services (or your own scripts) can send and receive SimpleX messages programmatically.

SimpleX Chat is the first messenger with no user identifiers — not even random numbers. It's fully open source, end-to-end encrypted, and metadata-resistant by design.

## What this package does

- Boots `simplex-chat` in bot mode (`-p 5226 --create-bot-display-name "SimpleX Bot" --create-bot-allow-files`) so the binary auto-creates a fresh profile on first start.
- Bridges the bot's internal TCP control port to a WebSocket via [`websocat`](https://github.com/vi/websocat), so any WebSocket client can drive the bot using the [SimpleX bot protocol](https://github.com/simplex-chat/simplex-chat/blob/stable/bots/README.md). StartOS wraps this in its own NAT/PAT layer and surfaces the user-facing URL under *Interfaces* in the package UI.
- Persists the bot's profile and chat history to the package's `main` volume — there's no separate package-level config, since the bot's own profile is the source of truth.
- Adds StartOS actions that talk directly to the running bot over the same WebSocket protocol (using the daemon container's bridge IP, no extra ports), to edit the live profile and to mint one-time invitation links.

## Features

- **Configure** — fetches the bot's current display name + profile picture (over WebSocket) and lets you edit them. Changes are pushed straight to the bot via `/_profile`; no restart needed.
- **Create Invitation** — drives the running bot to produce a one-time SimpleX invitation link with QR code. Each invocation produces a fresh link.
- **Reset Profile** (Danger Zone) — wipe the bot identity and start over from a fresh "SimpleX Bot" profile.
- **Backups** — the `main` volume is included in StartOS backups, so snapshots cover the bot identity and all chat history.

## Architecture

```
External WebSocket client                StartOS actions
        │                                (Configure / Create Invitation)
        │  URL surfaced by StartOS              │
        │  (Interfaces → WebSocket)             │  ws://<container-ip>:5225
        ▼                                       │  (uses effects.getContainerIp)
   StartOS NAT/PAT                              │
        │                                       ▼
        └───────────────▶ websocat (container :5225) ──▶ ws://127.0.0.1:5226
                                                                │
                                                        simplex-chat (-p 5226)
                                                                │
                                                                └─ /data (volume "main")
                                                                   └─ .simplex/   (profile + bot.log)
```

`5225` is the container-internal port `websocat` listens on. External clients
reach it through StartOS's NAT/PAT layer using whichever LAN/Tor URL the OS
publishes. StartOS actions take a shortcut: they ask the SDK for the daemon
container's bridge-network IP and open a WebSocket directly to it, no second
port or socket required.

## Building

```sh
make            # builds for x86_64 and aarch64
make x86_64     # single arch
make install    # installs to the StartOS host configured in ~/.startos/config.yaml
make clean
```

Prerequisites: `start-cli` (see [Start9 SDK install docs](https://docs.start9.com/latest/developer-guide/sdk/installing-the-sdk)), `npm`, and Docker.

## Repository

- Package: <https://github.com/lundog/simplex-chat-startos>
- Upstream: <https://github.com/simplex-chat/simplex-chat>

## License

MIT — see `LICENSE`.
