import { utils } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { adminEmail, storeJson } from '../fileModels/store.json'
import { runCli } from '../utils'
import { accountExists, asStdin, passwordSpec } from './accounts'

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
    allowedStatuses: 'any',
    group: i18n('Account'),
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const adminPassword = utils.getDefaultString(passwordSpec)

    // Ask Ovumcy: the store can disagree with the database after a restore.
    const rotated = await accountExists(effects, adminEmail)

    if (rotated) {
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
      message: rotated
        ? i18n(
            'Sign in with this at the Web Interface. Ovumcy will immediately ask you to choose a new password — that is expected after a reset, so this one is good for a single sign-in. Nothing is emailed; this server sends no mail.',
          )
        : i18n(
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
