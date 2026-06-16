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

  return sdk.Daemons.of(effects)
    .addDaemon('simplex', {
      subcontainer,
      exec: {
        command: sdk.useEntrypoint(),
      },
      ready: {
        display: null, // surfaced to users (and dependents) via the 'websocket' health check below
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, port, {
            successMessage: i18n('WebSocket is ready'),
            errorMessage: i18n('WebSocket is not ready'),
          }),
      },
      requires: [],
    })
    // Standalone health check with a stable ID ('websocket') that dependent
    // packages can reference in a `kind: 'running'` dependency requirement.
    // Part of the file exchange contract (docs/file-exchange-architecture.md §4).
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
})
