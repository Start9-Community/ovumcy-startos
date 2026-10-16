import { sdk } from './sdk'

/**
 * 'main' holds the SQLite database; 'startos' holds store.json, which carries
 * SECRET_KEY. Both are backed up, and both have to be: restoring the database
 * without the secret that sealed its sessions, TOTP secrets, webhook URLs and
 * calendar-feed URLs would leave every one of those unreadable.
 *
 * The 'fence' volume is excluded, deliberately. It holds the calendar-feed
 * restore fence, which only works while backups leave it out: it is how Ovumcy
 * tells a restored database apart from the database it replaced, so a calendar
 * feed an owner revoked cannot come back live at its old subscribe URL. After
 * a restore the fence no longer matches the database in front of it, the app
 * disarms every armed feed on its next start and logs that it did, and each
 * owner re-generates the subscribe URLs they still want. That is the intended
 * outcome — not data loss. Adding 'fence' here would silently defeat it.
 *
 * StartOS stops the service for the duration of a backup, so the SQLite file
 * is quiescent while it is copied; no dump or checkpoint step is needed.
 */
export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) => sdk.Backups.ofVolumes('main', 'startos'),
)
