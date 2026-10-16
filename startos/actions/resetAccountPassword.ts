import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { adminEmail, storeJson } from '../fileModels/store.json'
import { runCli } from '../utils'
import { asStdin, emailPattern, passwordSpec } from './accounts'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  email: Value.text({
    name: i18n('Email'),
    description: i18n(
      'The account to reset. Run List Accounts if you are not sure of the address.',
    ),
    required: true,
    default: null,
    patterns: [emailPattern],
    inputmode: 'email',
  }),
  password: Value.text({
    name: i18n('New Password'),
    description: i18n('Generated for you, or type one of your own.'),
    required: true,
    masked: true,
    default: passwordSpec,
    generate: passwordSpec,
  }),
})

/**
 * The way back in when someone has lost both their password and their recovery
 * code. There is no email reset on this server — nothing can send mail — so
 * this action is the only recovery path, and it belongs to whoever administers
 * the server.
 */
export const resetAccountPassword = sdk.Action.withInput(
  'reset-account-password',

  {
    name: i18n('Reset Account Password'),
    description: i18n(
      'Set a new password for one account. Use it when someone has lost both their password and their recovery code. Every session for that account is signed out.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
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

    // Keep the stored admin credential honest: resetting that account here
    // would otherwise leave Set Admin Password reporting a password that no
    // longer works.
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
