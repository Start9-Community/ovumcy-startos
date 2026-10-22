import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// The package configures no SMTP, so a local address is correct.
export const adminEmail = 'admin@ovumcy.local'

export const defaultReminderHour = 9

const shape = z.looseObject({
  secretKey: z.string().optional().catch(undefined),
  adminPassword: z.string().optional().catch(undefined),
  registrationOpen: z.boolean().catch(false),
  cookieSecure: z.boolean().catch(true),
  timezone: z.string().catch('UTC'),
  reminderScheduler: z.boolean().catch(true),
  reminderHour: z.number().int().min(0).max(23).catch(defaultReminderHour),
  auditLog: z.boolean().catch(false),
  blockPrivateWebhooks: z.boolean().catch(false),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)

export type Store = z.infer<typeof shape>

// Spelled out: Omit over the looseObject's index signature would drop every named key.
export type AppConfig = {
  secretKey?: string
  registrationOpen: boolean
  cookieSecure: boolean
  timezone: string
  reminderScheduler: boolean
  reminderHour: number
  auditLog: boolean
  blockPrivateWebhooks: boolean
}
