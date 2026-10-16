import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { setAdminPassword } from '../actions/setAdminPassword'

/**
 * While no admin password is stored, raise a critical task pointing at Set
 * Admin Password. Critical means the service does not start until it is done,
 * which is what we want twice over: there is no account to sign in to yet, and
 * a reachable Ovumcy with no accounts is an instance waiting to be claimed by
 * whoever opens the address first.
 *
 * Task creation is idempotent on its replay key, so this is a no-op on every
 * rebuild once the password is set.
 */
export const watchCredentials = sdk.setupOnInit(async (effects) => {
  const adminPassword = await storeJson
    .read((s) => s.adminPassword)
    .const(effects)

  if (!adminPassword) {
    await sdk.action.createOwnTask(effects, setAdminPassword, 'critical', {
      reason: i18n(
        'Create the admin account before anyone can sign in. This generates its password and applies it to Ovumcy.',
      ),
    })
  }
})
