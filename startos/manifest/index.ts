import { setupManifest } from '@start9labs/start-sdk'
import { installAlert, long, short } from './i18n'

export const manifest = setupManifest({
  id: 'simplex-chat',
  title: 'SimpleX Chat',
  license: 'MIT',
  packageRepo: 'https://github.com/lundog/simplex-chat-startos',
  upstreamRepo: 'https://github.com/simplex-chat/simplex-chat',
  marketingUrl: 'https://simplex.chat/',
  donationUrl: 'https://github.com/simplex-chat/simplex-chat#help-us-with-donations',
  description: { short, long },
  volumes: ['main'],
  images: {
    simplex: {
      source: {
        dockerBuild: {
          workdir: '.'
        }
      },
      arch: ['x86_64', 'aarch64']
    }
  },
  alerts: {
    install: installAlert
  },
  dependencies: {}
})
