import { VersionGraph, VersionInfo } from '@start9labs/start-sdk'

const v010 = VersionInfo.of<'0.1.0:0'>({
  version: '0.1.0:0',
  releaseNotes: [
    'Initial release of SimpleX Chat for StartOS, bundling simplex-chat v6.5.2 as a headless bot.',
    '',
    'Features:',
    '• WebSocket interface — drive the bot programmatically with the same JSON-RPC protocol any SimpleX client speaks.',
    '• Configure action — live editor for the bot\'s display name and profile picture; changes are pushed straight to the running bot, no restart.',
    '• Create Invitation action — generates a fresh one-time SimpleX invitation link with QR code on demand.',
    '• Reset Profile action — wipes the bot identity to start over from a clean slate.',
    '• Backups — full snapshot/restore of the bot identity and chat history via StartOS backups.',
  ].join('\n'),
  migrations: {},
})

export const versionGraph = VersionGraph.of({
  current: v010,
  other: [],
})
