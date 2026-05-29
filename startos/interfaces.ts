import { sdk } from './sdk'
import { port } from './utils'
import { i18n } from './i18n'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const lanMulti = sdk.MultiHost.of(effects, 'main')
  const lanOrigin = await lanMulti.bindPort(port, {
    protocol: 'ws'
  })
  const wsInterface = sdk.createInterface(effects, {
    name: i18n('WebSocket'),
    id: 'ws',
    description: i18n('WebSocket for SimpleX Chat'),
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
