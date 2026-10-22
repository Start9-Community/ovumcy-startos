import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'
import { AppConfig, storeJson } from './fileModels/store.json'

export const uiPort = 8080

export const binary = '/app/ovumcy'

export const appUser = 'ovumcy'

export const chownCommand: [string, ...string[]] = [
  'chown',
  '-R',
  '10001:10001',
  '/app/data',
  '/app/fence',
]

export const dbPath = '/app/data/ovumcy.db'
export const fencePath = '/app/fence/calendar-feed.fence'

export const mounts = () =>
  sdk.Mounts.of()
    .mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/app/data',
      readonly: false,
    })
    .mountVolume({
      volumeId: 'fence',
      subpath: null,
      mountpoint: '/app/fence',
      readonly: false,
    })

// Shared by the daemon and every CLI command: a CLI run with a different DB_PATH would operate on a different, empty database.
export const appEnv = (store: AppConfig | null) => ({
  SECRET_KEY: store?.secretKey ?? '',
  DB_DRIVER: 'sqlite',
  DB_PATH: dbPath,
  // The CLI refuses a relative fence path.
  CALENDAR_FEED_FENCE_PATH: fencePath,
  PORT: String(uiPort),
  REGISTRATION_MODE: store?.registrationOpen ? 'open' : 'closed',
  TZ: store?.timezone ?? 'UTC',

  COOKIE_SECURE: String(store?.cookieSecure ?? true),
  HSTS_ENABLED: 'false',

  // Without these, fiber sees scheme http against the browser's https Origin and its CSRF check refuses every sign-in.
  // The OS proxy strips client-supplied X-Forwarded-* before adding its own, so trusting it is safe.
  TRUST_PROXY_ENABLED: 'true',
  PROXY_HEADER: 'X-Forwarded-For',
  // The host's address on lxcbr0: the source of every proxied request.
  TRUSTED_PROXIES: '10.0.3.1,fd00:3::1',

  // Every Tor client shares the box's own Tor daemon address, so upstream's 8 per 15m is spent by a whole household.
  RATE_LIMIT_LOGIN_MAX: '40',
  RATE_LIMIT_LOGIN_WINDOW: '15m',

  REMINDER_SCHEDULER_ENABLED: String(store?.reminderScheduler ?? true),
  REMINDER_SCHEDULER_HOUR: String(store?.reminderHour ?? 9),
  AUDIT_LOG_ENABLED: String(store?.auditLog ?? false),
  WEBHOOK_BLOCK_PRIVATE_ADDRESSES: String(store?.blockPrivateWebhooks ?? false),

  OIDC_ENABLED: 'false',
})

// Passwords go in `input`: upstream reads them from piped stdin and refuses argv and the environment.
export async function runCli(
  effects: T.Effects,
  args: string[],
  input?: string,
): Promise<string> {
  const store = await storeJson.read().once()

  return sdk.SubContainer.withTemp(
    effects,
    { imageId: 'ovumcy' },
    mounts(),
    'ovumcy-cli',
    async (sub) => {
      // An action can run before the service has ever started.
      await sub.execFail(chownCommand, { user: 'root' })

      const { stdout } = await sub.execFail([binary, ...args], {
        env: appEnv(store),
        user: appUser,
        input,
        // A first-ever command creates and migrates the database.
        timeout: null,
      })
      return stdout.toString()
    },
  )
}
