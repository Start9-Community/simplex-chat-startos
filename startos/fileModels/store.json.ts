import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  // Bearer tokens accepted by the OS reverse proxy on the WebSocket interface.
  // Each has a user-facing label; the proxy only ever sees the token strings.
  apiKeys: z
    .array(z.object({ label: z.string(), token: z.string() }))
    .catch([]),
})

export type Store = z.infer<typeof shape>

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: '/store.json' },
  shape,
)
