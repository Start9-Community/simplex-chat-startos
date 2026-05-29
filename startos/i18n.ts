const en = {
  // main
  'Starting SimpleX Chat!': 'Starting SimpleX Chat!',

  // interfaces / health
  WebSocket: 'WebSocket',
  'WebSocket for SimpleX Chat': 'WebSocket for SimpleX Chat',
  'WebSocket is ready': 'WebSocket is ready',
  'WebSocket is not ready': 'WebSocket is not ready',

  // action groups
  General: 'General',

  // configure action
  Configure: 'Configure',
  'Edit the SimpleX bot profile.': 'Edit the SimpleX bot profile.',
  'Display Name': 'Display Name',
  'The display name peers see when they connect to your bot.':
    'The display name peers see when they connect to your bot.',
  'Profile Picture': 'Profile Picture',
  'Profile picture as a base64 data URL (e.g. "data:image/jpg;base64,..."). Leave empty for no picture. Tip: small images (< 64KB) render best in SimpleX clients.':
    'Profile picture as a base64 data URL (e.g. "data:image/jpg;base64,..."). Leave empty for no picture. Tip: small images (< 64KB) render best in SimpleX clients.',
  'Could Not Update Profile': 'Could Not Update Profile',
  'No active user — the bot may not be fully started yet.':
    'No active user — the bot may not be fully started yet.',
  'Bot Refused Update': 'Bot Refused Update',
  'Profile Updated': 'Profile Updated',
  'The bot profile has been updated.': 'The bot profile has been updated.',
  'No changes were needed — the profile already matched.':
    'No changes were needed — the profile already matched.',

  // create-invitation
  'Create Invitation': 'Create Invitation',
  'Create a one-time SimpleX invitation link. Each invocation produces a fresh link that can be used by exactly one new contact — share it through any channel and have them paste it into their SimpleX client.':
    'Create a one-time SimpleX invitation link. Each invocation produces a fresh link that can be used by exactly one new contact — share it through any channel and have them paste it into their SimpleX client.',
  'One-Time Invitation Link': 'One-Time Invitation Link',
  'Send this link to one new contact. Each link can be redeemed by exactly one peer — run this action again to invite another person.':
    'Send this link to one new contact. Each link can be redeemed by exactly one peer — run this action again to invite another person.',
  'Short Link (recommended)': 'Short Link (recommended)',
  'Use this with modern SimpleX clients. Includes a QR code.':
    'Use this with modern SimpleX clients. Includes a QR code.',
  'Full Link (older clients)': 'Full Link (older clients)',
  'Backup format for older SimpleX clients that do not understand short links.':
    'Backup format for older SimpleX clients that do not understand short links.',
  'Could Not Reach Bot': 'Could Not Reach Bot',
  'No Invitation Link Returned': 'No Invitation Link Returned',

  // reset-profile
  'Reset Profile': 'Reset Profile',
  'Permanently delete the bot identity, all chats, and all contacts. A fresh profile will be created the next time the service starts.':
    'Permanently delete the bot identity, all chats, and all contacts. A fresh profile will be created the next time the service starts.',
  'This will permanently delete the bot identity, all chats, and all contacts. Anyone who has your current connection link will no longer be able to reach the bot. The fresh profile will revert to display name "SimpleX Bot" with no profile picture — you can change those again in the Configure action once the service is back up. This cannot be undone.':
    'This will permanently delete the bot identity, all chats, and all contacts. Anyone who has your current connection link will no longer be able to reach the bot. The fresh profile will revert to display name "SimpleX Bot" with no profile picture — you can change those again in the Configure action once the service is back up. This cannot be undone.',
  'Danger Zone': 'Danger Zone',
  'Reset Failed': 'Reset Failed',
  'Profile Reset': 'Profile Reset',
  'The bot identity and all chat data have been deleted. Start the service to generate a fresh profile.':
    'The bot identity and all chat data have been deleted. Start the service to generate a fresh profile.',
} as const

export const i18n = (key: keyof typeof en) => en[key]
