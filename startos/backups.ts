import { sdk } from './sdk'

/**
 * Back up the entire "main" volume — the SimpleX profile (.simplex/), and the bot log. That's
 * everything stateful in the package.
 */
export const { createBackup, restoreInit } = sdk.setupBackups(['main'])
