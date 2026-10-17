import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'
import { AppConfig, storeJson } from './fileModels/store.json'

/** The port Ovumcy serves HTTP on (PORT). Bound in startos/interfaces.ts and
 * health-checked in startos/main.ts. */
export const uiPort = 8080

/** The upstream binary, and the image's own CMD. */
export const binary = '/app/ovumcy'

/**
 * The user the daemon and every CLI command run as, matching upstream's own
 * `USER 10001`. StartOS mounts volumes root-owned on every start, so the two
 * data paths are chowned to this user first — by a oneshot ahead of the daemon
 * (startos/main.ts) and by `runCli` before each command. An `idmap` on the
 * mount would avoid the chown, but the host refuses it: `open_tree_attr
 * IDMAP: Operation not permitted`.
 */
export const appUser = 'ovumcy'

/** The data paths that must belong to `appUser` before anything writes them. */
const ownedPaths = ['/app/data', '/app/fence']

/**
 * Give the volumes to the app's user. Runs as root, is idempotent, and is
 * cheap — these directories hold one SQLite database and one small file.
 * Needed on every start because StartOS re-mounts the volumes root-owned.
 */
export const chownCommand: [string, ...string[]] = [
  'chown',
  '-R',
  '10001:10001',
  ...ownedPaths,
]

export const dbPath = '/app/data/ovumcy.db'
export const fencePath = '/app/fence/calendar-feed.fence'

/**
 * Both persisted paths, mounted the same way for the daemon and for CLI
 * commands. `/app/data` holds the SQLite database. `/app/fence` holds the
 * calendar-feed fence — it is a separate volume so backups can exclude it, and
 * it must be writable: with no fence behind it the app fails closed and
 * disarms every armed calendar feed on each start.
 */
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

/**
 * The environment Ovumcy runs under. Shared by the daemon and by every CLI
 * command, because the CLI opens the same database and applies the same
 * migrations — a command run with a different DB_PATH would quietly operate on
 * a different, empty database.
 */
export const appEnv = (store: AppConfig | null) => ({
  SECRET_KEY: store?.secretKey ?? '',
  DB_DRIVER: 'sqlite',
  DB_PATH: dbPath,
  // Absolute on purpose: the CLI refuses a relative fence path outright,
  // because no shell can prove it names the server's own file.
  CALENDAR_FEED_FENCE_PATH: fencePath,
  PORT: String(uiPort),
  REGISTRATION_MODE: store?.registrationOpen ? 'open' : 'closed',
  TZ: store?.timezone ?? 'UTC',
  DEFAULT_LANGUAGE: store?.language ?? 'en',

  // StartOS terminates TLS at its own proxy and forwards plain HTTP, so the
  // app always sees scheme http while the browser loaded the page over HTTPS.
  // COOKIE_SECURE is a setting here, not something derived from the request.
  COOKIE_SECURE: String(store?.cookieSecure ?? true),
  // StartOS owns the edge. Pinning a .local or .onion host to HTTPS in every
  // visitor's browser for a year is not ours to do.
  HSTS_ENABLED: 'false',

  // The OS reverse proxy must be trusted, or no browser can sign in.
  //
  // StartOS terminates TLS and forwards plain HTTP, so fiber's c.Scheme()
  // reports `http` while the browser's Origin header says `https`. Fiber's
  // CSRF middleware compares the two and refuses every unsafe request with
  // `reason="invalid referer"` — a 403 on sign-in that reads as a rejected
  // password. Trusting the proxy lets c.Scheme() read X-Forwarded-Proto, the
  // origins match, and the refusal goes away.
  //
  // Trusting these headers is safe here, which is the part worth checking
  // before copying this anywhere: the OS proxy *strips* any client-supplied
  // X-Forwarded-* and then inserts its own (start-core/src/net/http.rs,
  // apply_request_policy), so exactly one hop is ever present and it is the
  // OS's. X-Forwarded-For therefore carries the real client address, and the
  // per-IP limiters below key on something real rather than on one shared
  // bucket.
  TRUST_PROXY_ENABLED: 'true',
  PROXY_HEADER: 'X-Forwarded-For',
  // The host's fixed address on the LXC bridge (`lxcbr0`), which is the source
  // address of every proxied request: the terminating path connects to the
  // container with no source binding, so the route out of 10.0.3.0/24 selects
  // the bridge's own IP. Named exactly rather than as the /24, which would
  // also trust every sibling service on the box. The v6 address is the same
  // host, kept for the day that leg is used — today the terminating path is
  // IPv4 only. If a StartOS release ever moves this, sign-in fails exactly as
  // described above, and this is the line to widen.
  TRUSTED_PROXIES: '10.0.3.1,fd00:3::1',

  // On the LAN path X-Forwarded-For now carries each client's own address, so
  // the per-IP budget separates them. Over Tor it cannot: every client arrives
  // through the box's own Tor daemon and genuinely shares one source address,
  // so upstream's budget of 8 per 15 minutes is spent by the household
  // together. Widened to 40, which is 2.7/min — inside upstream's
  // 30-per-minute ceiling for this pair and well under its maximum of 100.
  // Nothing else is relaxed: the per-account logout budget and the
  // deliberately tight calendar-feed budget keep their defaults, and the feed
  // is the only endpoint reachable with no credential.
  RATE_LIMIT_LOGIN_MAX: '40',
  RATE_LIMIT_LOGIN_WINDOW: '15m',

  REMINDER_SCHEDULER_ENABLED: String(store?.reminderScheduler ?? true),
  REMINDER_SCHEDULER_HOUR: String(store?.reminderHour ?? 9),
  AUDIT_LOG_ENABLED: String(store?.auditLog ?? false),
  WEBHOOK_BLOCK_PRIVATE_ADDRESSES: String(store?.blockPrivateWebhooks ?? false),

  // No SSO story on StartOS, and auto-provisioning would be a second way to
  // create accounts beside the actions in this package.
  OIDC_ENABLED: 'false',
})

/**
 * Run one of Ovumcy's operator CLI commands in a throwaway subcontainer on the
 * real data volume, and return its output.
 *
 * `input` is piped to the command's stdin. That is the only way to hand the
 * CLI a password: `users create` and `reset-password` read it from an
 * interactive prompt or, as here, as the first line of piped stdin, and
 * deliberately never from argv or the environment, so neither a process list
 * nor an install log can leak it.
 */
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
      // The service may never have started — the admin-credential action runs
      // before the first start — so the volumes can still be root-owned here.
      await sub.execFail(chownCommand, { user: 'root' })

      const { stdout } = await sub.execFail([binary, ...args], {
        env: appEnv(store),
        user: appUser,
        input,
        // Migrations run on the way in, and a first-ever command creates the
        // database. Neither is bounded by the 30-second default.
        timeout: null,
      })
      return stdout.toString()
    },
  )
}
