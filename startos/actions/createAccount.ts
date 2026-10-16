import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { runCli } from '../utils'
import { asStdin, emailPattern, passwordSpec } from './accounts'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  email: Value.text({
    name: i18n('Email'),
    description: i18n(
      'The address this person signs in with. It is an identity, not a mailbox — this server sends no mail — so an address like alex@home.local is fine.',
    ),
    required: true,
    default: null,
    patterns: [emailPattern],
    inputmode: 'email',
  }),
  password: Value.text({
    name: i18n('Password'),
    description: i18n(
      'Generated for you. Give it to them over something private, and let them change it in the app afterwards.',
    ),
    required: true,
    masked: true,
    default: passwordSpec,
    generate: passwordSpec,
  }),
  showRecoveryCode: Value.toggle({
    name: i18n('Show Recovery Code'),
    description: i18n(
      'Also print the account recovery code. It is the only way back in if they lose both their password and access to this server, and it is shown once.',
    ),
    default: true,
  }),
})

/**
 * Create an account for someone else on this server — a partner, a family
 * member, a friend. Each account's cycle data is isolated from every other's.
 */
export const createAccount = sdk.Action.withInput(
  'create-account',

  {
    name: i18n('Create Account'),
    description: i18n(
      'Add an account for another person. Their calendar, symptoms and notes are theirs alone — no other account on this server can see them.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  inputSpec,

  async () => null,

  async ({ effects, input }) => {
    const output = await runCli(
      effects,
      [
        'users',
        'create',
        input.email,
        ...(input.showRecoveryCode ? ['--show-recovery-code'] : []),
      ],
      asStdin(input.password),
    )

    return {
      version: '1',
      title: i18n('Account Created'),
      message: i18n(
        'Give these to the person they belong to, then have them sign in at the Web Interface and change the password in Settings. They complete onboarding themselves; no cycle data passes through this form.',
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
          {
            type: 'multiline',
            name: i18n('Command Output'),
            description: i18n(
              'What Ovumcy reported, including the recovery code if you asked for one.',
            ),
            value: output.trim() || i18n('(no output)'),
            masked: true,
            copyable: true,
            qr: false,
            filename: null,
          },
        ],
      },
    }
  },
)
