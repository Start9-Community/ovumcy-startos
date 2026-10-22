import { utils } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

export const rotateAppSecret = sdk.Action.withoutInput(
  'rotate-app-secret',

  {
    name: i18n('Rotate App Secret'),
    description: i18n(
      'Generate a new application secret. Only do this if you believe the old one was exposed.',
    ),
    warning: i18n(
      'Everything sealed with the old secret stops working at once: every account is signed out, every two-factor authenticator must be set up again, and every stored reminder webhook and calendar subscribe URL has to be re-created. Cycle data itself is unaffected. Accounts and passwords still work.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  async ({ effects }) => {
    await storeJson.merge(effects, {
      secretKey: utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 64 }),
    })

    return {
      version: '1',
      title: i18n('App Secret Rotated'),
      message: i18n(
        'The service restarts with the new secret. Everyone signs in again; two-factor authentication, reminder webhooks and calendar feeds have to be set up again in the app.',
      ),
      result: null,
    }
  },
)
