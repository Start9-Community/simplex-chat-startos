import { T, utils } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'

const { InputSpec, Value, List } = sdk

/**
 * Manage the bearer tokens that gate outside access to the Websocket API.
 *
 * The tokens are enforced by the StartOS reverse proxy (see interfaces.ts).
 * Adding/removing a key here rewrites store.json, which re-runs
 * setupInterfaces and updates the proxy's accepted-token set live.
 */
const inputSpec = InputSpec.of({
  apiKeys: Value.list(
    List.obj(
      {
        name: i18n('API Keys'),
        description: i18n(
          'Bearer tokens that grant outside access to the Websocket API. Add one per client; delete to revoke. On-box services connect directly and never need a key.',
        ),
      },
      {
        displayAs: '{{label}}',
        uniqueBy: { all: ['label'] },
        spec: InputSpec.of({
          label: Value.text({
            name: i18n('Label'),
            description: i18n(
              'A name to identify this key (e.g. the client it belongs to).',
            ),
            required: true,
            default: null,
            placeholder: 'my-bot',
          }),
          token: Value.text({
            name: i18n('Token'),
            description: i18n(
              'Leave blank when adding a key and one is generated for you. Keep it secret.',
            ),
            required: false,
            default: null,
            masked: true,
            placeholder: '(auto-generated)',
          }),
        }),
      },
    ),
  ),
})

export const apiKeys = sdk.Action.withInput(
  'api-keys',
  async () => ({
    name: i18n('API Keys'),
    description: i18n(
      'Manage the bearer tokens that gate outside access to the Websocket API.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('General'),
    visibility: 'enabled',
  }),
  inputSpec,
  async () => {
    const store = await storeJson.read().once()
    return { apiKeys: store?.apiKeys ?? [] }
  },
  async ({ effects, input }) => {
    // Fill in a strong token for any new (blank) row; keep existing ones.
    const apiKeys = input.apiKeys.map((k) => ({
      label: k.label,
      token:
        k.token?.trim() ||
        utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 }),
    }))
    await storeJson.merge(effects, { apiKeys })

    return {
      version: '1',
      title: i18n('API Keys Saved'),
      message: i18n(
        'Outside clients authenticate with the header: Authorization: Bearer <token>',
      ),
      result: {
        type: 'group',
        value: apiKeys.map(
          (k): T.ActionResultMember => ({
            type: 'single',
            name: k.label,
            description: null,
            value: k.token,
            copyable: true,
            qr: false,
            masked: true,
          }),
        ),
      },
    }
  },
)
