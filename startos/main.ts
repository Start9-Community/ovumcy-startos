import { i18n } from './i18n'
import { sdk } from './sdk'
import { AppConfig, storeJson } from './fileModels/store.json'
import { appEnv, appUser, binary, chownCommand, mounts, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * Everything the daemon's environment is built from, in one reactive read.
   * Changing any of it through an action restarts the daemon so the new value
   * takes effect; `adminPassword` is outside the projection because it lives
   * in Ovumcy's database rather than its environment (see AppConfig).
   *
   * `eq` is explicit because the mapped value is an object: without it, two
   * structurally identical projections could count as a change and restart the
   * daemon on every write to the store.
   */
  const config = await storeJson
    .read(
      (s): AppConfig => ({
        secretKey: s.secretKey,
        registrationOpen: s.registrationOpen,
        cookieSecure: s.cookieSecure,
        timezone: s.timezone,
        language: s.language,
        reminderScheduler: s.reminderScheduler,
        reminderHour: s.reminderHour,
        auditLog: s.auditLog,
        blockPrivateWebhooks: s.blockPrivateWebhooks,
      }),
      (left, right) => JSON.stringify(left) === JSON.stringify(right),
    )
    .const(effects)

  if (!config?.secretKey) {
    // A Service Launch Error, not user-facing copy: the install-time init
    // generates this, so reaching here means the store was lost or never
    // seeded, and the next thing anyone does is read this string to debug it.
    throw new Error(
      'No SECRET_KEY in store.json. It is generated on install; a missing one means the startos volume was lost or never seeded.',
    )
  }

  // One subcontainer shared by the chown oneshot and the daemon, so that the
  // ownership the oneshot sets is the ownership the daemon sees.
  const subcontainer = sdk.SubContainer.of(
    effects,
    { imageId: 'ovumcy' },
    mounts(),
    'ovumcy-sub',
  )

  return sdk.Daemons.of(effects)
    .addOneshot('chown', {
      subcontainer,
      // Re-asked on every start, not install-time setup: StartOS re-mounts
      // the volumes root-owned each time, and the app runs as uid 10001.
      exec: { command: chownCommand, user: 'root' },
      requires: [],
    })
    .addDaemon('ovumcy', {
      subcontainer,
      exec: {
        // The image's CMD, named explicitly. The binary is a static Go
        // program with no init system to keep as PID 1.
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
        // Migrations run on start, and the first start of a fresh install
        // creates the database.
        gracePeriod: 30_000,
      },
      requires: ['chown'],
    })
})
