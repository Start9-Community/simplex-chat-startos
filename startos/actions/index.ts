import { sdk } from '../sdk'
import { configure } from './configure'
import { createInvitation } from './create-invitation'
import { apiKeys } from './api-keys'
import { resetProfile } from './reset-profile'

export const actions = sdk.Actions.of()
  .addAction(configure)
  .addAction(createInvitation)
  .addAction(apiKeys)
  .addAction(resetProfile)
