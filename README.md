# SimpleX Gateway for StartOS

A [StartOS](https://start9.com) package that runs the [SimpleX Chat](https://simplex.chat/) terminal client headless and exposes the SimpleX network over a WebSocket API, so other StartOS services, bots, or your own scripts can send and receive SimpleX messages and files programmatically.

SimpleX is the first messenger with no user identifiers — not even random numbers. It's fully open source, end-to-end encrypted, and metadata-resistant by design.

This is **not** a human chat app — there's no terminal or web UI to read and write messages. It's the programmatic on-ramp to SimpleX for your *software*: think of it as an SMS gateway, but for SimpleX. A bot, an integration (e.g. [OpenClaw](https://github.com/Start9-Community/openclaw-startos)), or your own scripts connect to its WebSocket and drive it. For human messaging, use the SimpleX mobile or desktop apps.

## What this package does

- Runs `simplex-chat` headless as a chat server (`-p`), exposing its WebSocket control API. On first start it auto-creates a SimpleX profile; by default that profile is marked as a **bot** (so peers' apps highlight commands and show command menus), but that's just the default — the gateway is equally useful for plain programmatic messaging.
- Bridges the internal control port to an external WebSocket via [`websocat`](https://github.com/vi/websocat), so any WebSocket client can drive it using the [SimpleX bot/chat protocol](https://github.com/simplex-chat/simplex-chat/blob/stable/bots/README.md). StartOS wraps this in its own NAT layer and surfaces the user-facing URL under *Interfaces* in the package UI.
- Gates outside access with a **bearer token** enforced at the StartOS reverse proxy (the *API Keys* action manages the tokens); requests without a valid token get `401` before reaching the container. Same-box dependents and the package's own actions bypass the gate by dialing the container's bridge IP directly.
- Persists the SimpleX profile and chat history to the package's `main` volume — the client's own profile is the source of truth for chat config; a small `store.json` alongside it holds the API keys.
- Adds StartOS actions that talk directly to the running client over the same WebSocket protocol (using the daemon container's bridge IP, no extra ports), to edit the live profile and to mint one-time invitation links.

## Features

- **Configure Bot Profile** — fetches the current display name, profile picture, and file-sharing setting (over WebSocket) and lets you edit them. Changes are pushed straight to the running client via `/_profile`; no restart needed.
- **Create Invitation** — drives the running client to produce a one-time SimpleX invitation link with QR code. Each invocation produces a fresh link.
- **API Keys** — manage the bearer tokens that gate outside access to the WebSocket API: add a labeled key per client, delete to revoke. One is generated on install.
- **Reset Profile** (Danger Zone) — wipe the SimpleX identity and start over from a fresh profile.
- **Backups** — the `main` volume is included in StartOS backups, so snapshots cover the identity and all chat history.

## Architecture

```
External WebSocket client                StartOS actions
        │                                (Configure / Create Invitation)
        │  URL surfaced by StartOS              │
        │  (Interfaces → WebSocket)             │  ws://<container-ip>:5225
        ▼                                       │  (uses effects.getContainerIp)
   StartOS NAT                                  │
        │                                       ▼
        └───────────────▶ websocat (container :5225) ──▶ ws://127.0.0.1:5226
                                                                │
                                                        simplex-chat (-p 5226)
                                                                │
                                                                └─ /data (volume "main")
                                                                   └─ .simplex/   (profile)
```

`5225` is the container-internal port `websocat` listens on. External clients
reach it through StartOS's NAT layer using whichever LAN/Tor URL the OS
publishes. StartOS actions take a shortcut: they ask the SDK for the daemon
container's bridge-network IP and open a WebSocket directly to it, no second
port or socket required.

## File exchange contract

The WebSocket only carries a small inline preview for image/video messages —
actual file bytes (documents, voice, full-resolution media) live on disk. So
other StartOS packages exchange files with the gateway by mounting subpaths of
this package's `main` volume via StartOS dependency mounts (`mountDependency`),
declared as an **optional** dependency so it stays opt-in. The package publishes a
well-known layout: the volume's `.simplex/media` subpath is mounted at `/simplex`
in the gateway's container as a **single mount**, containing:

| Volume subpath | Container path | Access for consumers | Purpose |
|---|---|---|---|
| `.simplex/media/inbound` | `/simplex/inbound` | read-only | Files received by the gateway (`--files-folder`) |
| `.simplex/media/tmp` | `/simplex/tmp` | read-only (optional) | In-progress transfers (`--temp-folder`) |
| `.simplex/media/outbound` | `/simplex/outbound` | read-write | Consumer-written files for the gateway to send |

**Why a single mount:** simplex-chat finishes a download with an atomic
`rename(2)` from `tmp` into `inbound`. Separate bind mounts would make that rename
cross filesystems and fail with `EXDEV`, stranding the payload — so on the gateway
side they must be siblings within one mount. Consumers are unaffected and may
mount `inbound` and `outbound` individually.

**Paths:** a consumer that mounts these subpaths at the *same mountpoints* can use
the paths verbatim. This is strictly required only for **outbound** — that path
travels over the WebSocket and is resolved inside the gateway's container, so it
must be valid there. **Inbound** is looser: the WS API reports only a filename,
which the consumer resolves against its own inbound directory, so the two sides
need only share the same host directory. The neutral `/simplex` prefix (rather
than `/data/...`) lets consumers mount at identical paths without colliding with
their own `/data` volume.

**Security:** consumers mount only the `media/*` subpaths — never the whole `main`
volume or `.simplex/` itself, which hold the SimpleX profile database and keys.
`inbound` is mounted read-only so consumers can't alter received files; write
access is limited to `outbound`.

For dependents that declare a `kind: 'running'` requirement, the package exposes a
`websocket` health check ID. [OpenClaw](https://github.com/Start9-Community/openclaw-startos)
is an example consumer.

## Building

```sh
make            # builds for x86_64 and aarch64
make x86_64     # single arch
make install    # installs to the StartOS host configured in ~/.startos/config.yaml
make clean
```

Prerequisites: `start-cli` (see [Start9 SDK install docs](https://docs.start9.com/latest/developer-guide/sdk/installing-the-sdk)), `npm`, and Docker.

## Repository

- Package: <https://github.com/Start9-Community/simplex-gateway-startos>
- Upstream: <https://github.com/simplex-chat/simplex-chat>

## License

MIT — see `LICENSE`.
