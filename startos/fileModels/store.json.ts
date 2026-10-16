import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

/**
 * Ovumcy is configured entirely through environment variables — it reads no
 * config file of its own — so this package's state lives here and is turned
 * into `exec.env` in startos/main.ts.
 *
 * It sits on the `startos` volume, which no subcontainer mounts: the app
 * secret and the admin password are package-generated credentials, and this
 * keeps them out of a directory the application itself can read.
 */

/** The admin account's sign-in identity. Ovumcy identifies accounts by email;
 * nothing is ever sent to this address — the package has no SMTP — so a local
 * address is correct and avoids implying mail will arrive. */
export const adminEmail = 'admin@ovumcy.local'

/** Upstream's six UI languages (DEFAULT_LANGUAGE). */
export const languages = ['en', 'ru', 'es', 'fr', 'de', 'it'] as const

export const defaultReminderHour = 9

const shape = z.looseObject({
  /** SECRET_KEY. Generated on install. Rotating it invalidates every session,
   * TOTP secret, stored webhook URL and calendar-feed subscribe URL. */
  secretKey: z.string().optional().catch(undefined),
  /** The admin credential this package owns, set by the set-admin-password
   * action. Unset means the action has not run yet, which is what the init
   * watcher turns into a critical task. */
  adminPassword: z.string().optional().catch(undefined),
  /** REGISTRATION_MODE. Closed by default: accounts are created by the admin
   * through the create-account action, so nobody who finds the address can
   * claim an account on this server. */
  registrationOpen: z.boolean().catch(false),
  /** COOKIE_SECURE. True by default — see README, "Cookie security and how you
   * reach the service". False allows sign-in over a plain-HTTP LAN address at
   * the cost of the session cookie's Secure flag. */
  cookieSecure: z.boolean().catch(true),
  /** TZ. Dates are cycle data, so the server's idea of "today" matters. */
  timezone: z.string().catch('UTC'),
  /** DEFAULT_LANGUAGE. */
  language: z.enum(languages).catch('en'),
  /** REMINDER_SCHEDULER_ENABLED. On by default: StartOS has no cron, so the
   * in-process pass is the only way webhook reminders can ever fire. It does
   * nothing until an owner sets their own webhook URL in the app's Settings. */
  reminderScheduler: z.boolean().catch(true),
  /** REMINDER_SCHEDULER_HOUR, local hour 0-23. */
  reminderHour: z.number().int().min(0).max(23).catch(defaultReminderHour),
  /** AUDIT_LOG_ENABLED. Off by default; the lines carry user ids and roles. */
  auditLog: z.boolean().catch(false),
  /** WEBHOOK_BLOCK_PRIVATE_ADDRESSES. Off by default so that a reminder
   * webhook can point at an ntfy or Gotify service on this same server. */
  blockPrivateWebhooks: z.boolean().catch(false),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)

export type Store = z.infer<typeof shape>

/**
 * Everything the running app is configured from — the store minus the admin
 * password, which lives in Ovumcy's own database rather than its environment,
 * so changing it must not restart the daemon. startos/main.ts reads exactly
 * this projection and startos/utils.ts turns it into the process environment.
 *
 * Spelled out rather than derived as `Omit<Store, 'adminPassword'>`: `Store`
 * comes from a `z.looseObject`, so it carries an index signature, and `Omit`
 * over an index signature discards every named property with it.
 */
export type AppConfig = {
  secretKey?: string
  registrationOpen: boolean
  cookieSecure: boolean
  timezone: string
  language: (typeof languages)[number]
  reminderScheduler: boolean
  reminderHour: number
  auditLog: boolean
  blockPrivateWebhooks: boolean
}
