import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { defaultReminderHour, storeJson } from '../fileModels/store.json'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  registrationOpen: Value.toggle({
    name: i18n('Open Registration'),
    description: i18n(
      'Let people create their own account from the sign-in page, instead of you creating each one with Create Account.',
    ),
    warning: i18n(
      'Anyone who can reach your LAN address or your onion address will be able to create an account on this server.',
    ),
    default: false,
  }),
  cookieSecure: Value.toggle({
    name: i18n('Require A Secure Connection To Sign In'),
    description: i18n(
      'Sign-in works from the https LAN address, or from your onion address in Tor Browser. Turn this off only if you need to sign in over a plain http:// address.',
    ),
    warning: i18n(
      'With this off, the session cookie loses its Secure flag and can be sent over an unencrypted connection. Anyone able to watch that traffic on your network could take over a signed-in session.',
    ),
    default: true,
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
      'The local hour the daily pass runs at, in the time zone below.',
    ),
    required: true,
    default: defaultReminderHour,
    min: 0,
    max: 23,
    integer: true,
    units: i18n('hour of day'),
  }),
  timezone: Value.text({
    name: i18n('Time Zone'),
    description: i18n(
      'An IANA time zone such as Europe/London or America/New_York, for the reminder hour. Each person sets their own time zone for their calendar in the app.',
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
      'Registration, sign-in security, daily reminders and logging. Everything each person tracks is set inside the app, not here.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  inputSpec,

  async ({ effects }) =>
    storeJson
      .read((s) => ({
        registrationOpen: s.registrationOpen,
        cookieSecure: s.cookieSecure,
        reminderScheduler: s.reminderScheduler,
        reminderHour: s.reminderHour,
        timezone: s.timezone,
        blockPrivateWebhooks: s.blockPrivateWebhooks,
        auditLog: s.auditLog,
      }))
      .once(),

  async ({ effects, input }) => {
    await storeJson.merge(effects, input)
  },
)
