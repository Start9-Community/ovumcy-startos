import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { setAdminPassword } from '../actions/setAdminPassword'

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
