import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'
import { AppConfig, storeJson } from './fileModels/store.json'

/** The port Ovumcy serves HTTP on (PORT). Bound in startos/interfaces.ts and
 * health-checked in startos/main.ts. */
export const uiPort = 8080

/** The upstream binary, and the image's own CMD. */
export const binary = '/app/ovumcy'

/**
 * The user the daemon and every CLI command run as, inside the container.
 *
 * The image declares `USER 10001` and upstream runs unprivileged, which is the
 * better posture and not available here. StartOS mounts volumes root-owned on
 * every start, so a uid-10001 process cannot write its own database, and the
 * two documented ways out are both closed: a `chown` oneshot needs a `chown`
 * binary, which an image built `FROM scratch` does not have, and an `idmap` on
 * the mount is refused by the host — `open_tree_attr IDMAP: Operation not
 * permitted`.
 *
 * So the process runs as root *within its own subcontainer*: a namespaced root
 * in a container whose only writable mounts are this service's two data
 * volumes. The alternative was to rebuild the binary into an image carrying
 * busybox, which would have discarded the Cosign signature and SLSA provenance
 * on the upstream image — a worse trade for a health-data service than
 * namespaced root.
 */
export const appUser = 'root'

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

  // Not behind a proxy we can prove anything about: this package binds plain
  // HTTP, so no X-Forwarded-* header is added, and trusting one that may be
  // appended rather than overwritten would make every per-IP limit spoofable.
  // Client IPs are therefore not recoverable — see the login budget below.
  TRUST_PROXY_ENABLED: 'false',

  // Every client reaches the app from the OS reverse proxy, and over Tor they
  // all arrive via the local Tor daemon, so upstream's per-IP login budget of
  // 8 per 15 minutes is shared by the whole household. Widened to 40, which is
  // 2.7/min — inside upstream's 30-per-minute ceiling for this pair and well
  // under its maximum of 100. Nothing else is relaxed: the per-account logout
  // budget and the deliberately tight calendar-feed budget keep their
  // defaults, and the feed is the only endpoint reachable with no credential.
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
