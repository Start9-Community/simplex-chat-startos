import { T } from '@start9labs/start-sdk'
import { T as SX } from '@simplex-chat/types'
import { sdk } from '../sdk'
import { callBot, withBotSession } from '../bot-client'
import { i18n } from '../i18n'

const { InputSpec, Value } = sdk

/**
 * Live editor for the bot's profile (display name + picture).
 *
 * Open: calls /user, prefills the form with the active user's current
 * profile, and stashes the userId + fullName in hidden fields so they ride
 * along on submit.
 *
 * Submit: sends /_profile <userId> { displayName, fullName, image } to the
 * running bot. The fullName comes from the stashed value so we don't erase
 * whatever the upstream profile holds beyond what this form exposes.
 *
 * Schema reference:
 *   https://github.com/simplex-chat/simplex-chat/blob/stable/bots/api/COMMANDS.md#showactiveuser
 *   https://github.com/simplex-chat/simplex-chat/blob/stable/bots/api/COMMANDS.md#apiupdateprofile
 */

const inputSpec = InputSpec.of({
  displayName: Value.text({
    name: i18n('Display Name'),
    description: i18n(
      'The display name peers see when they connect to your bot.',
    ),
    required: true,
    default: null,
    masked: false,
    placeholder: 'SimpleX Bot',
    minLength: 1,
    maxLength: 64,
    patterns: [],
    inputmode: 'text',
  }),
  image: Value.textarea({
    name: i18n('Profile Picture'),
    description: i18n(
      'Profile picture as a base64 data URL (e.g. "data:image/jpg;base64,..."). Leave empty for no picture. Tip: small images (< 64KB) render best in SimpleX clients.',
    ),
    required: false,
    default: null,
    placeholder: 'data:image/jpg;base64,...',
    minLength: null,
    maxLength: null,
    patterns: [],
  }),
  // Hidden — round-tripped from getInput → run so we know which user to
  // update and what to keep beyond what the form lets the user edit.
  _userId: Value.hidden<number | null>(),
  _fullName: Value.hidden<string | null>(),
})

async function fetchActiveUser(
  effects: T.Effects,
): Promise<{ userId: number; profile: SX.Profile }> {
  const env = await callBot(effects, '/user')
  if (env.resp?.type !== 'activeUser') {
    throw new Error(
      `Bot did not return an active user. Got: ${JSON.stringify(env.resp).slice(0, 500)}`,
    )
  }
  // env.resp narrows to CR.ActiveUser by the discriminated union — `user`
  // and `user.profile` are guaranteed by the upstream type.
  return { userId: env.resp.user.userId, profile: env.resp.user.profile }
}

export const configure = sdk.Action.withInput(
  'configure',
  async () => ({
    name: i18n('Configure'),
    description: i18n('Edit the SimpleX bot profile.'),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('General'),
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => {
    // Always fetch fresh — don't trust the prefill, since the bot's profile
    // can change between opens.
    const { userId, profile } = await fetchActiveUser(effects)
    return {
      displayName: profile.displayName ?? '',
      image: profile.image ?? '',
      _userId: userId,
      _fullName: profile.fullName ?? '',
    }
  },
  async ({ effects, input }) => {
    // Re-resolve the userId at submit time too: if the bot was reset or the
    // active user swapped between open and submit, the hidden field is
    // stale. We prefer the live value when they disagree.
    const live = await fetchActiveUser(effects).catch(() => null)
    const userId = live?.userId ?? input._userId
    if (typeof userId !== 'number') {
      return {
        version: '1',
        title: i18n('Could Not Update Profile'),
        message: i18n(
          'No active user — the bot may not be fully started yet.',
        ),
        result: null,
      }
    }

    const fullName = live?.profile.fullName ?? input._fullName ?? ''

    const newProfile: SX.Profile = {
      displayName: input.displayName,
      fullName,
      image: input.image?.trim() || undefined,
    }

    const cmd = `/_profile ${userId} ${JSON.stringify(newProfile)}`

    let env
    try {
      env = await withBotSession(effects, (send) => send(cmd))
    } catch (err) {
      return {
        version: '1',
        title: i18n('Could Not Update Profile'),
        message: (err as Error).message,
        result: null,
      }
    }

    const respType = env.resp?.type
    // The bot acknowledges /_profile with type: "userProfileUpdated" (or
    // "userProfileNoChange" if nothing changed). Anything else is unexpected.
    if (respType !== 'userProfileUpdated' && respType !== 'userProfileNoChange') {
      return {
        version: '1',
        title: i18n('Bot Refused Update'),
        message: `resp.type=${respType}\n\n${JSON.stringify(env.resp, null, 2).slice(0, 1800)}`,
        result: null,
      }
    }

    return {
      version: '1',
      title: i18n('Profile Updated'),
      message:
        respType === 'userProfileNoChange'
          ? i18n('No changes were needed — the profile already matched.')
          : i18n('The bot profile has been updated.'),
      result: null,
    }
  },
)
