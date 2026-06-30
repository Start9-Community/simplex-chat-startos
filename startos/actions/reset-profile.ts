import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { sdk } from '../sdk'
import { i18n } from '../i18n'

// Resolves to /media/startos/volumes/main (StartOS's on-host mount of our
// "main" volume), but typed against the manifest so a rename or removal of
// the volume would be a compile error rather than a runtime surprise.
const VOLUME_PATH = sdk.volumes.main.path

/**
 * Wipe all SimpleX Chat data from the "main" volume. Service must be stopped
 * so we don't race the daemon's writes. On next start the daemon's
 * --create-bot-display-name / --create-bot-allow-files args take effect again,
 * which means the fresh profile boots back at "SimpleX Bot" with no picture
 * and file sharing on.
 */
export const resetProfile = sdk.Action.withoutInput(
  'reset-profile',
  async () => ({
    name: i18n('Reset Profile'),
    description: i18n(
      'Permanently delete the bot identity, all chats, and all contacts. A fresh profile will be created the next time the service starts.',
    ),
    warning: i18n(
      'This will permanently delete the bot identity, all chats, and all contacts. Anyone who has your current connection link will no longer be able to reach the bot. The fresh profile will revert to display name "SimpleX Bot" with no profile picture — you can change those again in the Configure action once the service is back up. This cannot be undone.',
    ),
    allowedStatuses: 'only-stopped',
    group: i18n('Danger Zone'),
    visibility: 'enabled',
  }),
  async () => {
    try {
      const entries = await fs.readdir(VOLUME_PATH)
      for (const entry of entries) {
        // Keep store.json — API keys are bridge access config, not bot identity.
        if (entry === 'store.json') continue
        await fs.rm(path.join(VOLUME_PATH, entry), {
          recursive: true,
          force: true,
        })
      }
    } catch (err) {
      return {
        version: '1',
        title: i18n('Reset Failed'),
        message: (err as Error).message,
        result: null,
      }
    }

    return {
      version: '1',
      title: i18n('Profile Reset'),
      message: i18n(
        'The bot identity and all chat data have been deleted. Start the service to generate a fresh profile.',
      ),
      result: null,
    }
  },
)
