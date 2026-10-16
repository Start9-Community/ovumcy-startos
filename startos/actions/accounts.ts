import { T } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { runCli } from '../utils'

/** Ovumcy's sign-in rule for an email address, loose enough to accept the
 * local addresses a server with no SMTP will mostly use. The description is
 * what the user sees when the value is rejected, on every path into the
 * action, so it is translated like any other user-facing string. */
export const emailPattern = {
  regex: '[^@\\s]+@[^@\\s]+\\.[^@\\s]+',
  description: i18n('Must be an email address, for example alex@example.com'),
}

/** A generated password: long, and from the SDK's own RNG. */
export const passwordSpec = { charset: 'a-z,A-Z,0-9', len: 24 }

/**
 * Whether Ovumcy already holds an account for this address.
 *
 * `users list` prints one row per account including its email, so this is the
 * question "create or reset?" — asking it beats guessing from package state,
 * which can drift from the database (an account deleted in the app, a restored
 * backup from before an account existed).
 */
export async function accountExists(
  effects: T.Effects,
  email: string,
): Promise<boolean> {
  const listed = await runCli(effects, ['users', 'list'])
  return listed
    .split('\n')
    .some((line) => line.toLowerCase().includes(email.toLowerCase()))
}

/**
 * Hand a password to the CLI on stdin.
 *
 * Piped stdin supplies the password as the first line — the interactive prompt
 * is the path that asks twice. It never travels in argv or the environment, so
 * it cannot leak into a process list or an install log.
 */
export const asStdin = (password: string) => `${password}\n`
