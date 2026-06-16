import { sdk } from './sdk'

export const port = 5225

/**
 * The `main` volume is mounted wholly at /data (HOME, profile database).
 *
 * The file exchange contract (docs/file-exchange-architecture.md §3) re-mounts
 * the volume's `.simplex/media` subpath at a neutral /simplex prefix so that
 * consumer packages can mount its subdirectories at identical mountpoints
 * and use file paths from WS messages verbatim:
 *
 *   /simplex/inbound   (received files, --files-folder)
 *   /simplex/tmp       (in-progress transfers, --temp-folder)
 *   /simplex/outbound  (consumer-written files for outbound sends)
 *
 * The tree lives under the bot's profile dir (.simplex/media) rather than a
 * separate top-level dir, so everything SimpleX-related sits under .simplex/.
 *
 * This must be a SINGLE mount (not one mount per subdirectory): simplex-chat
 * moves completed downloads from the temp folder to the files folder with an
 * atomic rename, which fails with EXDEV ("Invalid cross-device link") if the
 * two directories are separate bind mounts.
 */
export const mainMounts = sdk.Mounts.of()
  .mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: '/data',
    readonly: false,
  })
  .mountVolume({
    volumeId: 'main',
    subpath: '.simplex/media',
    mountpoint: '/simplex',
    readonly: false,
  })
