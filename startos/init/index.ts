import { sdk } from '../sdk'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../versions'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { seedApiKeys } from './seedApiKeys'

// Argument order is run order. restoreInit runs FIRST so any backed-up data is
// on disk before the version graph migrates it or interfaces/actions register.
// seedApiKeys runs before setInterfaces so the proxy auth gate has its initial
// key on a fresh install.
export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedApiKeys,
  setInterfaces,
  setDependencies,
  actions,
)

export const uninit = sdk.setupUninit(versionGraph)
