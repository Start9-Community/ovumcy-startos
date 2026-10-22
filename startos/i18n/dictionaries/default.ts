export const DEFAULT_LANG = 'en_US'

const dict = {
  // actions/accounts.ts
  'Must be an email address, for example alex@example.com': 0,
  Account: 1,
  // actions/createAccount.ts
  Email: 2,
  'The address this person signs in with. It is an identity, not a mailbox — this server sends no mail — so an address like alex@home.local is fine.': 3,
  Password: 4,
  'Generated for you. Give it to them over something private, and let them change it in the app afterwards.': 5,
  'Show Recovery Code': 6,
  'Also print the account recovery code. It is the only way back in if they lose both their password and access to this server, and it is shown once.': 7,
  'Create Account': 8,
  'Add an account for another person. Their calendar, symptoms and notes are theirs alone — no other account on this server can see them.': 9,
  'Account Created': 10,
  'Give these to the person they belong to, then have them sign in at the Web Interface and change the password in Settings. They complete onboarding themselves; no cycle data passes through this form.': 11,
  'Command Output': 12,
  'What Ovumcy reported, including the recovery code if you asked for one.': 13,
  '(no output)': 14,
  // actions/deleteAccount.ts
  'The account to delete.': 15,
  'I understand this deletes their health data': 16,
  'The account and every cycle, symptom and note in it are removed. This cannot be undone except by restoring a backup.': 17,
  'Deleting an account destroys that person’s health record on this server.': 18,
  'Delete Account': 19,
  'Permanently remove one account and all of its health data from this server.': 20,
  'Nothing was deleted. Turn on the confirmation toggle if you really mean to remove this account and its health data.': 21,
  'Account Deleted': 22,
  'The account and its health data are gone.': 23,
  // actions/resetAccountPassword.ts
  'The account to reset.': 24,
  'New Password': 25,
  'Generated for you, or type one of your own.': 26,
  'Reset Account Password': 27,
  'Set a new password for one account. Use it when someone has lost both their password and their recovery code. Every session for that account is signed out.': 28,
  'Password Reset': 29,
  'Give this to the person it belongs to. Ovumcy will require them to choose a new password as soon as they sign in, so this one is good for a single sign-in. Their cycle data is untouched.': 30,
  // actions/rotateAppSecret.ts
  'Rotate App Secret': 31,
  'Generate a new application secret. Only do this if you believe the old one was exposed.': 32,
  'Everything sealed with the old secret stops working at once: every account is signed out, every two-factor authenticator must be set up again, and every stored reminder webhook and calendar subscribe URL has to be re-created. Cycle data itself is unaffected. Accounts and passwords still work.': 33,
  'App Secret Rotated': 34,
  'The service restarts with the new secret. Everyone signs in again; two-factor authentication, reminder webhooks and calendar feeds have to be set up again in the app.': 35,
  // actions/runReminderPass.ts
  'Send Reminders Now': 36,
  'Run one reminder pass immediately, instead of waiting for the daily one. Useful for checking that a webhook you just set up works.': 37,
  'Sends a reminder now to every account that has a webhook configured and is currently due one.': 38,
  'Reminder Pass Complete': 39,
  'Accounts with no webhook configured, or nothing due, are skipped — no output here does not mean something is broken.': 40,
  // actions/setAdminPassword.ts
  'Set Admin Password': 41,
  'Generate a new random password for the admin account and apply it to Ovumcy.': 42,
  'Replaces the stored admin password and signs that account out everywhere.': 43,
  'Admin Credentials': 44,
  'Sign in with this at the Web Interface. Ovumcy will immediately ask you to choose a new password — that is expected after a reset, so this one is good for a single sign-in. Nothing is emailed; this server sends no mail.': 45,
  'Sign in with these at the Web Interface. Nothing is emailed — this server sends no mail — so save the password somewhere you can find it, and save the recovery code the app offers you on first sign-in.': 46,
  'The admin account signs in with this address.': 47,
  // actions/settings.ts
  'Open Registration': 48,
  'Let people create their own account from the sign-in page, instead of you creating each one with Create Account.': 49,
  'Anyone who can reach your LAN address or your onion address will be able to create an account on this server.': 50,
  'Require A Secure Connection To Sign In': 51,
  'Sign-in works from the https LAN address, or from your onion address in Tor Browser. Turn this off only if you need to sign in over a plain http:// address.': 52,
  'With this off, the session cookie loses its Secure flag and can be sent over an unencrypted connection. Anyone able to watch that traffic on your network could take over a signed-in session.': 53,
  'Daily Reminder Pass': 54,
  'Lets Ovumcy check once a day whether anyone is due a reminder and send it to the webhook they configured. It does nothing until someone sets a webhook URL in the app’s own Settings. StartOS has no cron, so leaving this off means webhook reminders never fire.': 55,
  'Reminder Hour': 56,
  'The local hour the daily pass runs at, in the time zone below.': 57,
  'hour of day': 58,
  'Time Zone': 59,
  'An IANA time zone such as Europe/London or America/New_York, for the reminder hour. Each person sets their own time zone for their calendar in the app.': 60,
  'Must be UTC or an IANA zone name such as Europe/London': 61,
  'Block Private Webhook Targets': 62,
  'Refuses to deliver reminders to private or internal addresses. Leave this off if the ntfy or Gotify you send to runs on this same server or your LAN — turning it on would block exactly that.': 63,
  'Audit Log': 64,
  'Writes a line per security-relevant action to the service log. The lines carry account ids and roles, so treat the log as being as sensitive as the database. For investigating something specific, not for everyday use.': 65,
  Settings: 66,
  'Registration, sign-in security, daily reminders and logging. Everything each person tracks is set inside the app, not here.': 67,
  // init/watchCredentials.ts
  'Create the admin account before anyone can sign in. This generates its password and applies it to Ovumcy.': 68,
  // interfaces.ts
  'Web Interface': 69,
  'The Ovumcy calendar and settings. Everyone with an account on this server signs in here.': 70,
  // main.ts
  'The web interface is ready': 71,
  'The web interface is not ready': 72,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
