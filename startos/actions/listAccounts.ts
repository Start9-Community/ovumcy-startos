import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { runCli } from '../utils'

/**
 * Who has an account on this server. Reports only — no cycle data, which is
 * the point: an admin can administer accounts without reading anyone's health
 * record. It is also where the other account actions get their addresses.
 */
export const listAccounts = sdk.Action.withoutInput(
  'list-accounts',

  {
    name: i18n('List Accounts'),
    description: i18n(
      'Show every account on this server: id, email, role, display name, onboarding state and when it was created. No cycle data.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  async ({ effects }) => {
    const output = await runCli(effects, ['users', 'list'])

    return {
      version: '1',
      title: i18n('Accounts'),
      message: null,
      result: {
        type: 'multiline',
        value: output.trim() || i18n('(no accounts yet)'),
        masked: false,
        copyable: true,
        qr: false,
        filename: null,
      },
    }
  },
)
