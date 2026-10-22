import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { adminEmail, storeJson } from '../fileModels/store.json'
import { runCli } from '../utils'
import { accountSelect, asStdin, passwordSpec } from './accounts'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  email: accountSelect(i18n('The account to reset.')),
  password: Value.text({
    name: i18n('New Password'),
    description: i18n('Generated for you, or type one of your own.'),
    required: true,
    masked: true,
    default: passwordSpec,
    generate: passwordSpec,
  }),
})

export const resetAccountPassword = sdk.Action.withInput(
  'reset-account-password',

  {
    name: i18n('Reset Account Password'),
    description: i18n(
      'Set a new password for one account. Use it when someone has lost both their password and their recovery code. Every session for that account is signed out.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Account'),
    visibility: 'enabled',
  },

  inputSpec,

  async () => null,

  async ({ effects, input }) => {
    await runCli(
      effects,
      ['reset-password', input.email],
      asStdin(input.password),
    )

    if (input.email.toLowerCase() === adminEmail.toLowerCase()) {
      await storeJson.merge(effects, { adminPassword: input.password })
    }

    return {
      version: '1',
      title: i18n('Password Reset'),
      message: i18n(
        'Give this to the person it belongs to. Ovumcy will require them to choose a new password as soon as they sign in, so this one is good for a single sign-in. Their cycle data is untouched.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Email'),
            description: null,
            value: input.email,
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: input.password,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
