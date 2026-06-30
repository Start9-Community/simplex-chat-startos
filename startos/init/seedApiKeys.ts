import { T, utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'

/**
 * On a fresh install, seed one API key so the WebSocket auth gate is active
 * from first start and the user has a working token to copy from the API Keys
 * action. Runs only on `install` — it never re-seeds, so deleting every key
 * (to lock outside access) sticks.
 */
export const seedApiKeys = async (
  effects: T.Effects,
  kind: 'install' | 'update' | 'restore' | null,
): Promise<void> => {
  if (kind !== 'install') return
  await storeJson.merge(effects, {
    apiKeys: [
      {
        label: 'default',
        token: utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 }),
      },
    ],
  })
}
