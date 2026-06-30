import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'simplex-websocket-bridge',
  title: 'SimpleX Websocket Bridge',
  license: 'MIT',
  packageRepo:
    'https://github.com/Start9-Community/simplex-websocket-bridge-startos',
  upstreamRepo: 'https://github.com/simplex-chat/simplex-chat',
  marketingUrl: 'https://simplex.chat/',
  donationUrl:
    'https://github.com/simplex-chat/simplex-chat#help-us-with-donations',
  description: { short, long },
  volumes: ['main'],
  images: {
    // Consume the standalone container image published from
    // github.com/lundog/simplex-chat-docker, rather than building locally.
    // Bump this tag deliberately when the upstream SimpleX version changes.
    simplex: {
      source: {
        dockerTag: 'lundog/simplex-chat:6.5.4',
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
