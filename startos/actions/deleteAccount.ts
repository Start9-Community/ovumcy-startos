import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { runCli } from '../utils'
import { accountSelect } from './accounts'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  email: accountSelect(i18n('The account to delete.')),
  confirm: Value.toggle({
    name: i18n('I understand this deletes their health data'),
    description: i18n(
      'The account and every cycle, symptom and note in it are removed. This cannot be undone except by restoring a backup.',
    ),
    warning: i18n(
      'Deleting an account destroys that person’s health record on this server.',
    ),
    default: false,
  }),
})

export const deleteAccount = sdk.Action.withInput(
  'delete-account',

  {
    name: i18n('Delete Account'),
    description: i18n(
      'Permanently remove one account and all of its health data from this server.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Account'),
    visibility: 'enabled',
  },

  inputSpec,

  async () => null,

  async ({ effects, input }) => {
    if (!input.confirm) {
      throw new Error(
        i18n(
          'Nothing was deleted. Turn on the confirmation toggle if you really mean to remove this account and its health data.',
        ),
      )
    }

    // --yes answers the CLI's own prompt; the toggle is the confirmation a person reads.
    const output = await runCli(effects, [
      'users',
      'delete',
      input.email,
      '--yes',
    ])

    return {
      version: '1',
      title: i18n('Account Deleted'),
      message: i18n('The account and its health data are gone.'),
      result: {
        type: 'multiline',
        value: output.trim() || i18n('(no output)'),
        masked: false,
        copyable: false,
        qr: false,
        filename: null,
      },
    }
  },
)
