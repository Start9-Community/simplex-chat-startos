import { sdk } from './sdk'

/**
 * Back up the entire "main" volume which contains the SimpleX profile (.simplex/).
 * That's everything stateful in the package.
 */
export const { createBackup, restoreInit } = sdk.setupBackups(['main'])
