import { sdk } from './sdk'
import { setInterfaces } from './interfaces'
import { actions } from './actions'
import { restoreInit } from './backups'

// restoreInit runs FIRST so any backed-up data is on disk before interfaces or
// actions register. The order of arguments to setupInit is the order they run.
export const init = sdk.setupInit(restoreInit, setInterfaces, actions)

export const uninit = sdk.setupUninit()
