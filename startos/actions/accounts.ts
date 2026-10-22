import { T } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { runCli } from '../utils'

export const emailPattern = {
  regex: '[^@\\s]+@[^@\\s]+\\.[^@\\s]+',
  description: i18n('Must be an email address, for example alex@example.com'),
}

export const passwordSpec = { charset: 'a-z,A-Z,0-9', len: 24 }

// `users list` prints a header row, then one row per account with the email in the second column.
export const listEmails = async (effects: T.Effects) =>
  (await runCli(effects, ['users', 'list']))
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/)[1])
    .filter((email): email is string => !!email?.includes('@'))

export const accountExists = async (effects: T.Effects, email: string) =>
  (await listEmails(effects)).some(
    (e) => e.toLowerCase() === email.toLowerCase(),
  )

export const accountSelect = (description: string) =>
  sdk.Value.dynamicSelect(async ({ effects }) => ({
    name: i18n('Account'),
    description,
    default: null,
    values: Object.fromEntries(
      (await listEmails(effects)).map((email) => [email, email]),
    ),
  }))

export const asStdin = (password: string) => `${password}\n`
