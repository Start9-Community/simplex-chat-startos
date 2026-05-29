import { sdk } from './sdk'
import { port, mainMounts } from './utils'
import { i18n } from './i18n'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting SimpleX Chat!'))

  const subcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'simplex' },
    mainMounts,
    'simplex-sub',
  )

  return sdk.Daemons.of(effects).addDaemon('simplex', {
    subcontainer,
    exec: {
      command: sdk.useEntrypoint(),
    },
    ready: {
      display: i18n('WebSocket'),
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, port, {
          successMessage: i18n('WebSocket is ready'),
          errorMessage: i18n('WebSocket is not ready'),
        }),
    },
    requires: [],
  })
})
