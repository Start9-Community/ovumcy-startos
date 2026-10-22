import { i18n } from './i18n'
import { sdk } from './sdk'
import { AppConfig, storeJson } from './fileModels/store.json'
import { appEnv, appUser, binary, chownCommand, mounts, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  // adminPassword is excluded: it lives in Ovumcy's database, and rotating it must not restart the daemon.
  const config = await storeJson
    .read(
      (s): AppConfig => ({
        secretKey: s.secretKey,
        registrationOpen: s.registrationOpen,
        cookieSecure: s.cookieSecure,
        timezone: s.timezone,
        reminderScheduler: s.reminderScheduler,
        reminderHour: s.reminderHour,
        auditLog: s.auditLog,
        blockPrivateWebhooks: s.blockPrivateWebhooks,
      }),
      (left, right) => JSON.stringify(left) === JSON.stringify(right),
    )
    .const(effects)

  if (!config?.secretKey) {
    throw new Error(
      'No SECRET_KEY in store.json. It is generated on install; a missing one means the startos volume was lost or never seeded.',
    )
  }

  const subcontainer = sdk.SubContainer.of(
    effects,
    { imageId: 'ovumcy' },
    mounts(),
    'ovumcy-sub',
  )

  return sdk.Daemons.of(effects)
    .addOneshot('chown', {
      subcontainer,
      // StartOS mounts the volumes root-owned on every start.
      exec: { command: chownCommand, user: 'root' },
      requires: [],
    })
    .addDaemon('ovumcy', {
      subcontainer,
      exec: {
        command: [binary],
        env: appEnv(config),
        user: appUser,
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
        gracePeriod: 30_000,
      },
      requires: ['chown'],
    })
})
