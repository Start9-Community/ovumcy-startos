import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { runCli } from '../utils'
import { emailPattern } from './accounts'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  email: Value.text({
    name: i18n('Email'),
    description: i18n(
      'The account to delete. Run List Accounts first to be certain of the address.',
    ),
    required: true,
    default: null,
    patterns: [emailPattern],
    inputmode: 'email',
  }),
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

/**
 * Removing an account takes its health data with it. That is the right
 * behavior — somebody leaving a household should be able to have their cycle
 * record gone, not orphaned — which is exactly why it asks first.
 */
export const deleteAccount = sdk.Action.withInput(
  'delete-account',

  {
    name: i18n('Delete Account'),
    description: i18n(
      'Permanently remove one account and all of its health data from this server.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
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

    // --yes answers the CLI's own DELETE confirmation; the toggle above is the
    // one a person actually reads. An address matching more than one account
    // is refused by the CLI rather than resolved to whichever row comes first,
    // and that error reaches the user as-is.
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
