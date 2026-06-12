import { VersionGraph, VersionInfo } from '@start9labs/start-sdk'

const v010 = VersionInfo.of<'0.1.0:0'>({
  version: '0.1.0:0',
  releaseNotes: [
    'Initial release of SimpleX Chat for StartOS, bundling simplex-chat v6.5.2 as a headless bot.',
    '',
    'Features:',
    '- WebSocket interface — drive the bot programmatically with the same JSON-RPC protocol any SimpleX client speaks.',
    "- Configure action — live editor for the bot's display name and profile picture; changes are pushed straight to the running bot, no restart.",
    '- Create Invitation action — generates a fresh one-time SimpleX invitation link with QR code on demand.',
    '- Reset Profile action — wipes the bot identity to start over from a clean slate.',
    '- Backups — full snapshot/restore of the bot identity and chat history via StartOS backups.',
  ].join('\n'),
  migrations: {},
})

const v011 = VersionInfo.of<'0.1.1:0'>({
  version: '0.1.1:0',
  releaseNotes: [
    'Reliability and hardening release — no API changes, no behavior changes for healthy installs.',
    '',
    'Fixes:',
    '- Process supervision — entrypoint now supervises both simplex-chat and websocat. Previously, if simplex-chat crashed while websocat kept running, the StartOS port-listening health check stayed green even though every bot command would hang. The container now exits (and StartOS restarts it) the moment either child dies.',
    '- Entrypoint exits explicitly if simplex-chat does not open its control port within 60 seconds, instead of silently starting the bridge against a dead bot.',
    '',
    'Improvements:',
    '- Daemon stdout/stderr now flow to PID 1 and are captured by StartOS Logs (with automatic rotation). The on-volume bot.log file is gone, which also keeps backups tight.',
    '- Dockerfile pins SHA-256 hashes for the simplex-chat and websocat binaries it downloads, so a compromised release or man-in-the-middle download fails the build.',
    '- Profile Picture field in the Configure action now caps input at ~256KB of binary (≈350KB base64) to prevent accidental giant pastes from bloating the bot profile.',
    '- Reset Profile resolves the volume path through sdk.volumes for type-safety against future manifest changes.',
    '- Instructions clarify that the WebSocket interface has no built-in authentication — anyone who can reach the URL StartOS publishes can drive the bot.',
  ].join('\n'),
  migrations: {},
})

const v020 = VersionInfo.of<'0.2.0:0'>({
  version: '0.2.0:0',
  releaseNotes: [
    'Shared volume file exchange release',
    '',
    'Features:',
    '- Shared volume file exchange — enables file sending and receiving via /simplex/outbound and /simplex/inbound folders.',
    '- Updates upstream simplex-chat to v6.5.4.',
  ].join('\n'),
  migrations: {},
})

export const versionGraph = VersionGraph.of({
  current: v020,
  other: [v010, v011],
})
