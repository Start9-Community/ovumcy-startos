import { utils } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { adminEmail, storeJson } from '../fileModels/store.json'
import { runCli } from '../utils'
import { accountExists, asStdin, passwordSpec } from './accounts'

/**
 * The package owns the admin credential: it generates it, applies it to
 * Ovumcy, stores it, and returns it. The same action covers first-set and
 * rotation, so there is exactly one place a password comes from.
 *
 * This is also what keeps the instance from being claimed by whoever opens
 * the address first. Registration is closed by default and no account exists
 * until this action runs, so Ovumcy's own first-run sign-up cannot be used to
 * take the server over.
 */
export const setAdminPassword = sdk.Action.withoutInput(
  'set-admin-password',

  async ({ effects }) => ({
    name: i18n('Set Admin Password'),
    description: i18n(
      'Generate a new random password for the admin account and apply it to Ovumcy.',
    ),
    warning: (await storeJson.read((s) => s.adminPassword).const(effects))
      ? i18n(
          'Replaces the stored admin password and signs that account out everywhere.',
        )
      : null,
    // Must run while stopped: until it has, the critical task it answers keeps
    // the service from starting.
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const adminPassword = utils.getDefaultString(passwordSpec)

    // Create the account the first time, reset it afterwards. Asking Ovumcy
    // which case this is — rather than inferring it from the store — keeps a
    // restored backup, or an account deleted inside the app, from turning into
    // a failed command.
    if (await accountExists(effects, adminEmail)) {
      await runCli(
        effects,
        ['reset-password', adminEmail],
        asStdin(adminPassword),
      )
    } else {
      await runCli(
        effects,
        ['users', 'create', adminEmail],
        asStdin(adminPassword),
      )
    }

    await storeJson.merge(effects, { adminPassword })

    return {
      version: '1',
      title: i18n('Admin Credentials'),
      message: i18n(
        'Sign in with these at the Web Interface. Nothing is emailed — this server sends no mail — so save the password somewhere you can find it, and save the recovery code the app offers you on first sign-in.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Email'),
            description: i18n('The admin account signs in with this address.'),
            value: adminEmail,
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: adminPassword,
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
