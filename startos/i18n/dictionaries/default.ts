export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts / interfaces.ts / health
  'Starting SimpleX Websocket Bridge!': 0,
  Websocket: 1,
  'Websocket API for driving SimpleX programmatically': 2,
  'Websocket is ready': 3,
  'Websocket is not ready': 4,

  // action groups
  General: 5,
  'Danger Zone': 6,

  // configure action
  'Configure Bot Profile': 7,
  'Edit the bot profile — display name, picture, and file sharing.': 8,
  'Display Name': 9,
  'The display name peers see when they connect to your bot.': 10,
  'Profile Picture': 11,
  'Profile picture as a base64 data URL (e.g. "data:image/jpg;base64,..."). Leave empty for no picture. Tip: small images (< 64KB) render best in SimpleX clients.': 12,
  'Could Not Update Profile': 13,
  'No active user — the bot may not be fully started yet.': 14,
  'Bot Refused Update': 15,
  'Allow files & media': 16,
  'When on, contacts can send files and media to the bridge, and the bridge can send them. When off, file and media transfers are disabled.': 17,

  // create-invitation action
  'Create Invitation': 18,
  'Create a one-time SimpleX invitation link. Each invocation produces a fresh link that can be used by exactly one new contact — share it through any channel and have them paste it into their SimpleX client.': 19,
  'One-Time Invitation Link': 20,
  'Send this link to one new contact. Each link can be redeemed by exactly one peer — run this action again to invite another person.': 21,
  'Short Link (recommended)': 22,
  'Use this with modern SimpleX clients. Includes a QR code.': 23,
  'Full Link (older clients)': 24,
  'Backup format for older SimpleX clients that do not understand short links.': 25,
  'Could Not Reach Bot': 26,
  'No Invitation Link Returned': 27,

  // reset-profile action
  'Reset Profile': 28,
  'Permanently delete the bot identity, all chats, and all contacts. A fresh profile will be created the next time the service starts.': 29,
  'This will permanently delete the bot identity, all chats, and all contacts. Anyone who has your current connection link will no longer be able to reach the bot. The fresh profile will revert to display name "SimpleX Bot" with no profile picture — you can change those again in the Configure action once the service is back up. This cannot be undone.': 30,
  'Reset Failed': 31,
  'Profile Reset': 32,
  'The bot identity and all chat data have been deleted. Start the service to generate a fresh profile.': 33,

  // api-keys action
  'API Keys': 34,
  'Manage the bearer tokens that gate outside access to the Websocket API.': 35,
  'Bearer tokens that grant outside access to the Websocket API. Add one per client; delete to revoke. On-box services connect directly and never need a key.': 36,
  Label: 37,
  'A name to identify this key (e.g. the client it belongs to).': 38,
  Token: 39,
  'Leave blank when adding a key and one is generated for you. Keep it secret.': 40,
  'API Keys Saved': 41,
  'Outside clients authenticate with the header: Authorization: Bearer <token>': 42,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
