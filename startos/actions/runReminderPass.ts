import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { runCli } from '../utils'

/**
 * One reminder pass, now, instead of waiting for tomorrow's scheduled one.
 * Without this, verifying that a newly configured ntfy or Gotify webhook
 * actually arrives means waiting up to a day.
 */
export const runReminderPass = sdk.Action.withoutInput(
  'run-reminder-pass',

  {
    name: i18n('Send Reminders Now'),
    description: i18n(
      'Run one reminder pass immediately, instead of waiting for the daily one. Useful for checking that a webhook you just set up works.',
    ),
    warning: i18n(
      'Sends a reminder now to every account that has a webhook configured and is currently due one.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  async ({ effects }) => {
    const output = await runCli(effects, ['notify'])

    return {
      version: '1',
      title: i18n('Reminder Pass Complete'),
      message: i18n(
        'Accounts with no webhook configured, or nothing due, are skipped — no output here does not mean something is broken.',
      ),
      result: {
        type: 'multiline',
        value: output.trim() || i18n('(no output)'),
        masked: false,
        copyable: true,
        qr: false,
        filename: null,
      },
    }
  },
)
