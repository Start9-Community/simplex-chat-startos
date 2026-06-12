# SimpleX Chat File Exchange — Shared Volume Architecture

**Target repositories:** `simplex-chat-startos` (this repo), `openclaw-startos`, `openclaw-simplex` plugin  
**Goal:** Enable consumers (currently OpenClaw) to exchange files with `simplex-chat` across container boundaries on StartOS.

---

## 1. Problem Statement

The `simplex-chat` CLI stores received files on its local filesystem (via `--files-folder` and `--temp-folder`). The `openclaw-simplex` plugin passes raw filesystem paths into OpenClaw message context as `MediaUrl`, assuming OpenClaw shares the same filesystem. When OpenClaw runs in a different container, those paths are unreadable on both sides:

- **Inbound** (receiving): Files arrive in `simplex-chat` but OpenClaw cannot read them.
- **Outbound** (sending): OpenClaw resolves media to local paths that `simplex-chat` cannot see.

---

## 2. Decision Summary

**Supersedes** the HTTP API sidecar plan (v1.x of this document). Instead of adding an HTTP file server to the simplex-chat container, the consumer mounts simplex-chat's volume directly using StartOS **dependency volume mounts** (`mountDependency`), declared as an **optional dependency**.

Why this is better:

- The plugin's original assumption — raw paths work — becomes true again. No HTTP server, no Python in the image, no new published port, no staging-upload protocol, no auth questions.
- SimpleX remains **opt-in** for OpenClaw users: the dependency is `optional: true`, declared as required-and-running by `setupDependencies` only when the user enables the SimpleX channel. Users who don't enable it download nothing SimpleX-related.
- Release pipelines stay separate: simplex-chat-startos and openclaw-startos version and ship independently.
- simplex-chat-startos stays **consumer-agnostic**: all coupling (dependency declaration, volume mounts, path knowledge) lives in the consumer package. This repo only publishes a contract (§3).

What stays: **websocat**. Cross-package WS traffic still cannot reach simplex-chat's localhost-only bind, so the existing 0.0.0.0:5225 → 127.0.0.1:5226 bridge remains.

---

## 3. The File Exchange Contract (consumer-agnostic)

simplex-chat-startos publishes two things any consumer can use:

**1. WebSocket control interface** (existing): the `ws` service interface on port 5225, used to drive the bot.

**2. A well-known volume layout** on the `main` volume: the `simplex` subpath is mounted at `/simplex` in the simplex-chat container as a **single mount**, containing three plain subdirectories:

| Volume subpath | Container path | Access for consumers | Purpose |
|---|---|---|---|
| `simplex/inbound` | `/simplex/inbound` | read-only | Received files (`--files-folder`) |
| `simplex/tmp` | `/simplex/tmp` | read-only (optional) | In-progress transfers (`--temp-folder`) |
| `simplex/outbound` | `/simplex/outbound` | read-write | Consumer-written files for outbound sends |

Directional naming is from the consumer's perspective and matches OpenClaw's own `media/inbound` convention: `inbound` is what the bot received, `outbound` is what the consumer wants sent.

**Why a single mount on the simplex side:** simplex-chat moves a completed download from the temp folder to the files folder with an atomic `rename(2)`. If `tmp` and `inbound` are separate bind mounts, the rename crosses filesystem boundaries and fails with `EXDEV` ("Invalid cross-device link"), leaving a zero-byte file in `inbound` and the decrypted payload stranded in `tmp`. They must be sibling directories within one mount. Consumers are unaffected and may mount `simplex/inbound` and `simplex/outbound` individually — nothing renames across those.

**Path guarantee:** any consumer that mounts these subpaths at the *same mountpoints* (`/simplex/inbound`, `/simplex/outbound`, …) can use file paths from WS messages verbatim, and can pass `/simplex/outbound/...` paths in send commands verbatim. No path translation anywhere.

The neutral `/simplex` prefix (rather than `/data/...`) exists so consumers can mount at identical paths without colliding with their own `/data` volume.

Consumers should **not** mount the whole `main` volume — it contains the bot's profile database and keys. Mount only the subpaths above.

---

## 4. Changes: `simplex-chat-startos` (this repo)

No new processes, no Dockerfile changes — only mounts and flags.

`startos/utils.ts` — add the contract mount alongside the existing `/data` mount (a single mount; see §3 for why the subdirectories must not be separate mounts):

```typescript
export const mainMounts = sdk.Mounts.of()
  .mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: '/data',
    readonly: false,
  })
  .mountVolume({
    volumeId: 'main',
    subpath: 'simplex',
    mountpoint: '/simplex',
    readonly: false,
  })
```

(The subpath lives on the `main` volume, so received and outbound files persist and are included in StartOS backups. `/data/simplex/inbound` and `/simplex/inbound` are the same data; the `/simplex` prefix is the published contract.)

`entrypoint.sh` — create the contract directories and point simplex-chat at them:

```bash
mkdir -p /simplex/inbound /simplex/tmp /simplex/outbound

/usr/local/bin/simplex-chat \
  -p 5226 \
  --create-bot-display-name "SimpleX Bot" \
  --create-bot-allow-files \
  --files-folder /simplex/inbound \
  --temp-folder /simplex/tmp \
  &
```

Everything else in `entrypoint.sh` (the two-child supervisor, the 5226 readiness wait, websocat) is unchanged.

`startos/main.ts` — add a standalone health check so dependents have a stable health check ID to reference in their `kind: 'running'` dependency requirement. This is part of the contract, not optional:

```typescript
.addHealthCheck('websocket', {
  ready: {
    display: i18n('WebSocket'),
    fn: () =>
      sdk.healthCheck.checkPortListening(effects, port, {
        successMessage: i18n('WebSocket is ready'),
        errorMessage: i18n('WebSocket is not ready'),
      }),
  },
  requires: ['simplex'],
})
```

`README.md` — document the contract (§3), with OpenClaw noted as an example consumer.

Note: adding `--files-folder` changes where received files land. Files received before this change stay in the profile's default location; only new transfers use the contract paths.

---

## 5. Changes: `openclaw-startos`

### 5.1 Manifest — optional dependency

```typescript
dependencies: {
  'simplex-chat': {
    description: 'Enables the SimpleX Chat channel for OpenClaw',
    optional: true,
    s9pk: '<path or url to simplex-chat s9pk for build-time metadata>',
  },
},
```

### 5.2 `dependencies.ts` — declare requirement only when enabled

```typescript
export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  const simplexEnabled = await openclawJson
    .read((c) => c.channels?.['openclaw-simplex']?.enabled)
    .const(effects)

  return simplexEnabled
    ? {
        'simplex-chat': {
          kind: 'running',
          healthChecks: ['websocket'], // exposed by simplex-chat-startos (§4)
          versionRange: '>=0.2.0',
        },
      }
    : {}
})
```

When the user enables the channel, StartOS's standard dependency UI prompts them to install simplex-chat from the marketplace and warns if it isn't running. This *is* the "Install SimpleX" opt-in experience — no custom plumbing.

### 5.3 `main.ts` — conditional dependency mounts

```typescript
let mounts = mainMounts()
if (simplexEnabled) {
  mounts = mounts
    .mountDependency({
      dependencyId: 'simplex-chat',
      volumeId: 'main',
      subpath: 'simplex/inbound',
      mountpoint: '/simplex/inbound',
      readonly: true,
    })
    .mountDependency({
      dependencyId: 'simplex-chat',
      volumeId: 'main',
      subpath: 'simplex/outbound',
      mountpoint: '/simplex/outbound',
      readonly: false,
    })
}
```

(`sdk.Mounts` is an immutable builder — reassign, don't mutate.) Mountpoints under `/simplex` don't collide with OpenClaw's own `/data` volume. The enabled flag must be read with `.const(effects)` so toggling it re-runs `setupMain` and adds/removes the mounts.

### 5.4 Channel connection config

`wsUrl` points at the simplex-chat WS interface as today. Since the packages now run on the same box, the address can be resolved programmatically from the dependency's service interface (`sdk.serviceInterface.get` with `packageId: 'simplex-chat'`) and injected into the plugin config, rather than hand-entered by the user. The published LAN URL remains a valid manual fallback.

---

## 6. Changes: `openclaw-simplex` plugin

### Inbound (received files)

The WS API reports a received file relative to the runtime's `--files-folder` — `fileSource.filePath` is typically just the file name (`IMG_123.jpg`). The plugin resolves it against `files.inboundDir` (the contract's `/simplex/inbound`; defaults to `/tmp`, where simplex-chat saves files when started without `--files-folder`) to locate the file on disk.

The resulting path is readable by OpenClaw, but cannot be passed to the agent directly: OpenClaw's media tools and sandboxed workspaces only accept files inside the shared media store (`~/.openclaw/media/inbound/*`), like every other bundled channel. On `rcvFileComplete`, the plugin therefore reads the file from the shared volume and stages it into the media store via `core.channel.media.saveMediaBuffer(buffer, mime, "inbound", maxBytes, fileName)`, passing the saved path as `MediaPath`/`MediaUrl` (plus `MediaPaths`). If staging fails it falls back to the raw path.

Note the plugin cannot delete originals from `/simplex/inbound` (mounted read-only); retention of received files is the simplex-chat side's concern.

### Outbound (sending files)

In `src/channel/media/simplex-media.ts`, when media resolves to a buffer (e.g. fetched from a remote URL), write it into the shared outbound directory instead of OpenClaw's private media dir, then pass that path to simplex-chat:

```typescript
const outboundDir = config.files?.outboundDir // e.g. "/simplex/outbound"

if (outboundDir) {
  const fileName = `${randomUUID()}-${path.basename(params.mediaUrl) || "file"}`
  const outboundPath = path.join(outboundDir, fileName)
  await fs.writeFile(outboundPath, fetched.buffer)
  return { path: outboundPath, contentType: fetched.contentType, fileName }
}
// Fallback: legacy local-path behavior (single-filesystem deployments)
```

### Cleanup

After simplex-chat confirms the send, the plugin deletes the outbound file directly (`fs.unlink`) — it has filesystem access now. Optionally, sweep stale files in `outboundDir` older than some retention period on startup.

### Config surface

One new optional key, sibling-level with `connection`:

```json
{
  "channels": {
    "openclaw-simplex": {
      "enabled": true,
      "connection": {
        "connectTimeoutMs": 60000,
        "wsUrl": "wss://10.0.1.2:52237"
      },
      "files": {
        "inboundDir": "/simplex/inbound",
        "outboundDir": "/simplex/outbound"
      }
    }
  }
}
```

If `files.outboundDir` is unset, the plugin behaves exactly as before (single-filesystem assumption).

---

## 7. Security Considerations

| Concern | Mitigation |
|---|---|
| Consumer access to bot profile/keys | Consumers mount only `inbound`/`outbound` subpaths, never the whole volume |
| Consumer modifying received files | `inbound` mounted read-only in the consumer |
| Outbound dir abuse | Write access limited to the `outbound` subpath; plugin generates UUID filenames; plugin deletes after send |
| Network surface | None added — this design removes the planned HTTP port entirely; only the existing WS interface is published |
| Cross-package trust | Dependency mounts are an explicit, user-visible StartOS relationship; the user opts in by enabling the channel and installing the dependency |

---

## 8. Implementation Checklist

`simplex-chat-startos`:

- `startos/utils.ts` — add single `simplex` subpath mount at `/simplex`
- `entrypoint.sh` — `mkdir -p` the contract dirs; add `--files-folder /simplex/inbound --temp-folder /simplex/tmp`
- `startos/main.ts` — `websocket` standalone health check for dependents to reference
- `README.md` — document the file exchange contract

`openclaw-startos`:

- `startos/manifest/index.ts` — optional `simplex-chat` dependency
- `startos/dependencies.ts` — conditional `kind: 'running'` requirement referencing `websocket`
- `startos/main.ts` — conditional `mountDependency` mounts (inbound ro, outbound rw)
- Channel enable toggle wired to config; wsUrl resolution from dependency interface

`openclaw-simplex` plugin:

- Inbound: resolve relative WS file paths against `files.inboundDir`; stage into the media store
- Outbound: write buffers into `files.outboundDir` when configured
- Cleanup: unlink outbound file after send confirmation
- Config schema: add optional `files.inboundDir` / `files.outboundDir`

---

## 9. Alternatives Considered

| Approach | Why Not Chosen |
|---|---|
| HTTP API sidecar in the simplex container (v1.x of this doc) | Extra daemon, Python added to image, new published unauthenticated port, upload/cleanup protocol to maintain — all to simulate the shared filesystem that dependency mounts provide natively |
| Bundle simplex-chat as a subcontainer of openclaw-startos | Forces the SimpleX image into every OpenClaw install (images are baked into the s9pk; no runtime fetch) and unites the two release pipelines |
| Shared Docker volume (manual) | Not expressible on StartOS outside the dependency-mount mechanism; couples deployments |
| SFTP/SCP bridge | More moving parts, harder to secure, needs auth |
| Base64 over WebSocket | The WS carries only an inline ~10 KB downscaled *preview* for image/video messages (`msgContent.image` data URL) — verified against a 75 KB photo whose `chatItem.file` still required `/freceive` via XFTP. Documents, voice, and arbitrary files have no inline content at all; the filesystem is the only path to actual file bytes. (The preview could serve as a low-fidelity fallback for images when no shared volume is configured.) |

---

*Document version: 2.2*  
*Author: Lundog & Goose 🪿; revised by Claude*  
*Date: 2026-06-11*
