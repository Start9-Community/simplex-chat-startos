import { sdk } from './sdk'
import { port } from './utils'
import { i18n } from './i18n'
import { storeJson } from './fileModels/store.json'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Read the API keys reactively: when the API Keys action rewrites them,
  // setupInterfaces re-runs and the OS reverse proxy picks up the new token set.
  const apiKeys = await storeJson.read((s) => s.apiKeys).const(effects)
  const tokens = (apiKeys ?? []).map((k) => k.token)

  const lanMulti = sdk.MultiHost.of(effects, 'main')
  const lanOrigin = await lanMulti.bindPort(port, {
    protocol: 'ws',
    // Bearer auth enforced at the StartOS reverse proxy: outside clients must
    // send `Authorization: Bearer <token>` or get 401 before reaching the
    // container. Same-box dependents (and our own actions) bypass by dialing
    // the container's bridge IP directly — that path doesn't traverse the proxy.
    addSsl: {
      auth: { type: 'bearer', tokens, realm: 'SimpleX Gateway' },
    },
  })
  const wsInterface = sdk.createInterface(effects, {
    name: i18n('WebSocket'),
    id: 'ws',
    description: i18n('WebSocket for SimpleX Gateway'),
    type: 'api',
    masked: false,
    schemeOverride: { ssl: 'wss', noSsl: 'ws' },
    username: null,
    path: '',
    query: {},
  })
  const receipt = await lanOrigin.export([wsInterface])

  return [receipt]
})
