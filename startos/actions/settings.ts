import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { defaultReminderHour, storeJson } from '../fileModels/store.json'

const { InputSpec, Value } = sdk

/**
 * Keys mirror store.json, so the prefill and the write are pass-throughs and
 * a field added to one side without the other is a type error.
 */
const inputSpec = InputSpec.of({
  timezone: Value.text({
    name: i18n('Time Zone'),
    description: i18n(
      'An IANA time zone such as Europe/London or America/New_York. Cycle entries are dates, so this decides where the server’s day starts.',
    ),
    required: true,
    default: 'UTC',
    patterns: [
      {
        regex: '(UTC|[A-Za-z]+/[A-Za-z_+-]+(/[A-Za-z_+-]+)?)',
        description: i18n(
          'Must be UTC or an IANA zone name such as Europe/London',
        ),
      },
    ],
  }),
  language: Value.select({
    name: i18n('Language'),
    description: i18n('The language the app is shown in.'),
    default: 'en',
    values: {
      en: 'English',
      de: 'Deutsch',
      es: 'Español',
      fr: 'Français',
      it: 'Italiano',
      ru: 'Русский',
    },
  }),
  reminderScheduler: Value.toggle({
    name: i18n('Daily Reminder Pass'),
    description: i18n(
      'Lets Ovumcy check once a day whether anyone is due a reminder and send it to the webhook they configured. It does nothing until someone sets a webhook URL in the app’s own Settings. StartOS has no cron, so leaving this off means webhook reminders never fire.',
    ),
    default: true,
  }),
  reminderHour: Value.number({
    name: i18n('Reminder Hour'),
    description: i18n(
      'The local hour the daily pass runs at, in the time zone above.',
    ),
    required: true,
    default: defaultReminderHour,
    min: 0,
    max: 23,
    integer: true,
    units: i18n('hour of day'),
  }),
  blockPrivateWebhooks: Value.toggle({
    name: i18n('Block Private Webhook Targets'),
    description: i18n(
      'Refuses to deliver reminders to private or internal addresses. Leave this off if the ntfy or Gotify you send to runs on this same server or your LAN — turning it on would block exactly that.',
    ),
    default: false,
  }),
  auditLog: Value.toggle({
    name: i18n('Audit Log'),
    description: i18n(
      'Writes a line per security-relevant action to the service log. The lines carry account ids and roles, so treat the log as being as sensitive as the database. For investigating something specific, not for everyday use.',
    ),
    default: false,
  }),
})

export const settings = sdk.Action.withInput(
  'settings',

  {
    name: i18n('Settings'),
    description: i18n(
      'Time zone, language, daily reminders and logging. Everything each person tracks is set inside the app, not here.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  inputSpec,

  async ({ effects }) => {
    const store = await storeJson.read().once()
    if (!store) return null
    return {
      timezone: store.timezone,
      language: store.language,
      reminderScheduler: store.reminderScheduler,
      reminderHour: store.reminderHour,
      blockPrivateWebhooks: store.blockPrivateWebhooks,
      auditLog: store.auditLog,
    }
  },

  async ({ effects, input }) => {
    await storeJson.merge(effects, input)
  },
)
