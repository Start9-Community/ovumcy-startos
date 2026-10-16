import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

/**
 * Registration is closed by default and accounts are created by the admin.
 * Opening it is a legitimate choice for a trusting household — it saves
 * handing out generated passwords — but it means anyone who can reach the
 * address can create an account, so it says so in both directions.
 */
export const toggleRegistration = sdk.Action.withoutInput(
  'toggle-registration',

  async ({ effects }) => {
    const open = await storeJson.read((s) => s.registrationOpen).const(effects)
    return {
      name: open ? i18n('Close Registration') : i18n('Open Registration'),
      description: open
        ? i18n(
            'Anyone who can reach this service can currently create their own account. Run this to close it.',
          )
        : i18n(
            'Accounts are currently created by you, with Create Account. Run this to let people sign themselves up instead.',
          ),
      warning: open
        ? i18n(
            'New accounts can no longer be created from the sign-in page. Existing accounts are unaffected.',
          )
        : i18n(
            'Anyone who can reach your LAN address or your onion address will be able to create an account on this server.',
          ),
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    // .once(), not .const(): a reactive read here would be a write to a file
    // this handler has just subscribed to.
    const open = await storeJson.read((s) => s.registrationOpen).once()
    await storeJson.merge(effects, { registrationOpen: !open })
  },
)
