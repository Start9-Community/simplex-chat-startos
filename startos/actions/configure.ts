import { T } from '@start9labs/start-sdk'
import { T as SX } from '@simplex-chat/types'
import { sdk } from '../sdk'
import { callBot, withBotSession } from '../bot-client'
import { i18n } from '../i18n'

const { InputSpec, Value } = sdk

/**
 * Live editor for the bridge's SimpleX profile: display name, picture, and
 * file/media sharing.
 *
 * Open: calls /user and prefills the form from the active user's current
 * profile — including the live file-sharing preference, so submitting without
 * touching the toggle can't silently flip it.
 *
 * Submit: re-fetches the live profile and sends /_profile <userId> <profile>
 * with the edited fields applied *on top of* it, so peerType (the bot marker)
 * and any other preferences are preserved, not clobbered.
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
    // ≈256KB of binary after base64 expansion — generous for a profile
    // picture, but prevents accidental "I pasted the wrong file" submissions
    // from bloating the bot profile and StartOS backups.
    maxLength: 350_000,
    patterns: [],
  }),
  allowFiles: Value.toggle({
    name: i18n('Allow files & media'),
    description: i18n(
      'When on, contacts can send files and media to the bridge, and the bridge can send them. When off, file and media transfers are disabled.',
    ),
    default: true,
  }),
  // Hidden — round-tripped from getInput → run as fallbacks if the live
  // re-fetch on submit fails.
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
    name: i18n('Configure Bot Profile'),
    description: i18n(
      'Edit the bot profile — display name, picture, and file sharing.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('General'),
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => {
    // Always fetch fresh — don't trust a stale prefill, since the profile can
    // change between opens.
    const { userId, profile } = await fetchActiveUser(effects)
    return {
      displayName: profile.displayName ?? '',
      image: profile.image ?? '',
      // Anything other than an explicit "no" is treated as enabled (the
      // bridge's default), so an unset preference reads as on.
      allowFiles: profile.preferences?.files?.allow !== SX.FeatureAllowed.No,
      _userId: userId,
      _fullName: profile.fullName ?? '',
    }
  },
  async ({ effects, input }) => {
    // Re-resolve the live profile at submit time: if the bot was reset or the
    // active user swapped between open and submit, the hidden fields are stale.
    const live = await fetchActiveUser(effects).catch(() => null)
    const userId = live?.userId ?? input._userId
    if (typeof userId !== 'number') {
      return {
        version: '1',
        title: i18n('Could Not Update Profile'),
        message: i18n('No active user — the bot may not be fully started yet.'),
        result: null,
      }
    }

    // Apply edits on top of the current profile so peerType and any other
    // preferences ride through untouched.
    const base = live?.profile
    const newProfile: SX.Profile = {
      displayName: input.displayName,
      fullName: base?.fullName ?? input._fullName ?? '',
      shortDescr: base?.shortDescr,
      image: input.image?.trim() || undefined,
      contactLink: base?.contactLink,
      preferences: {
        ...base?.preferences,
        files: {
          allow: input.allowFiles
            ? SX.FeatureAllowed.Yes
            : SX.FeatureAllowed.No,
        },
      },
      peerType: base?.peerType,
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
    if (
      respType !== 'userProfileUpdated' &&
      respType !== 'userProfileNoChange'
    ) {
      return {
        version: '1',
        title: i18n('Bot Refused Update'),
        message: `resp.type=${respType}\n\n${JSON.stringify(env.resp, null, 2).slice(0, 1800)}`,
        result: null,
      }
    }

    // Success — no modal; hitting save already implies the update.
    return null
  },
)
