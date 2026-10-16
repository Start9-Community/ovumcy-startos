import { utils } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

/**
 * Seed store.json on install: generate SECRET_KEY, and let every other key
 * fall to its schema default.
 *
 * SECRET_KEY is required before Ovumcy will start, and it is what seals
 * sessions, TOTP secrets, stored webhook URLs and calendar-feed subscribe
 * URLs. It is generated once, here, and never shown to anyone — it is not a
 * credential a person uses. It lives on the `startos` volume, which is backed
 * up alongside the database precisely because a restored database without it
 * would have none of those things readable.
 */
export const seedStore = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  await storeJson.write(effects, {
    secretKey: utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 64 }),
    registrationOpen: false,
    cookieSecure: true,
    timezone: 'UTC',
    language: 'en',
    reminderScheduler: true,
    reminderHour: 9,
    auditLog: false,
    blockPrivateWebhooks: false,
  })
})
