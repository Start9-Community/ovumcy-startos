export const DEFAULT_LANG = 'en_US'

const dict = {
  // actions/accounts.ts
  'Must be an email address, for example alex@example.com': 0,
  // actions/allowInsecureCookies.ts
  'Allow Sign-In Over Plain HTTP': 1,
  'Require A Secure Connection To Sign In': 2,
  'Sign-in currently requires a secure address: the https LAN address, or your onion address in Tor Browser. Run this only if you need to sign in over a plain http:// address.': 3,
  'Sign-in currently works over plain http, without the session cookie’s Secure flag. Run this to require a secure address again.': 4,
  'The session cookie loses its Secure flag, so it can be sent over an unencrypted connection. Anyone able to watch that traffic on your network could take over a signed-in session. Prefer trusting your server’s Root CA and using the https address.': 5,
  'Sign-in over plain http:// addresses will stop working. Use the https LAN address, or Tor Browser for your onion address.': 6,
  // actions/createAccount.ts
  Email: 7,
  'The address this person signs in with. It is an identity, not a mailbox — this server sends no mail — so an address like alex@home.local is fine.': 8,
  Password: 9,
  'Generated for you. Give it to them over something private, and let them change it in the app afterwards.': 10,
  'Show Recovery Code': 11,
  'Also print the account recovery code. It is the only way back in if they lose both their password and access to this server, and it is shown once.': 12,
  'Create Account': 13,
  'Add an account for another person. Their calendar, symptoms and notes are theirs alone — no other account on this server can see them.': 14,
  'Account Created': 15,
  'Give these to the person they belong to, then have them sign in at the Web Interface and change the password in Settings. They complete onboarding themselves; no cycle data passes through this form.': 16,
  'Command Output': 17,
  'What Ovumcy reported, including the recovery code if you asked for one.': 18,
  '(no output)': 19,
  // actions/deleteAccount.ts
  'The account to delete. Run List Accounts first to be certain of the address.': 20,
  'I understand this deletes their health data': 21,
  'The account and every cycle, symptom and note in it are removed. This cannot be undone except by restoring a backup.': 22,
  'Deleting an account destroys that person’s health record on this server.': 23,
  'Delete Account': 24,
  'Permanently remove one account and all of its health data from this server.': 25,
  'Nothing was deleted. Turn on the confirmation toggle if you really mean to remove this account and its health data.': 26,
  'Account Deleted': 27,
  'The account and its health data are gone.': 28,
  // actions/listAccounts.ts
  'List Accounts': 29,
  'Show every account on this server: id, email, role, display name, onboarding state and when it was created. No cycle data.': 30,
  Accounts: 31,
  '(no accounts yet)': 32,
  // actions/resetAccountPassword.ts
  'The account to reset. Run List Accounts if you are not sure of the address.': 33,
  'New Password': 34,
  'Generated for you, or type one of your own.': 35,
  'Reset Account Password': 36,
  'Set a new password for one account. Use it when someone has lost both their password and their recovery code. Every session for that account is signed out.': 37,
  'Password Reset': 38,
  'Give this to the person it belongs to. Ovumcy will require them to choose a new password as soon as they sign in, so this one is good for a single sign-in. Their cycle data is untouched.': 39,
  // actions/rotateAppSecret.ts
  'Rotate App Secret': 40,
  'Generate a new application secret. Only do this if you believe the old one was exposed.': 41,
  'Everything sealed with the old secret stops working at once: every account is signed out, every two-factor authenticator must be set up again, and every stored reminder webhook and calendar subscribe URL has to be re-created. Cycle data itself is unaffected. Accounts and passwords still work.': 42,
  'App Secret Rotated': 43,
  'The service restarts with the new secret. Everyone signs in again; two-factor authentication, reminder webhooks and calendar feeds have to be set up again in the app.': 44,
  // actions/runReminderPass.ts
  'Send Reminders Now': 45,
  'Run one reminder pass immediately, instead of waiting for the daily one. Useful for checking that a webhook you just set up works.': 46,
  'Sends a reminder now to every account that has a webhook configured and is currently due one.': 47,
  'Reminder Pass Complete': 48,
  'Accounts with no webhook configured, or nothing due, are skipped — no output here does not mean something is broken.': 49,
  // actions/setAdminPassword.ts
  'Set Admin Password': 50,
  'Generate a new random password for the admin account and apply it to Ovumcy.': 51,
  'Replaces the stored admin password and signs that account out everywhere.': 52,
  'Admin Credentials': 53,
  'Sign in with this at the Web Interface. Ovumcy will immediately ask you to choose a new password — that is expected after a reset, so this one is good for a single sign-in. Nothing is emailed; this server sends no mail.': 54,
  'Sign in with these at the Web Interface. Nothing is emailed — this server sends no mail — so save the password somewhere you can find it, and save the recovery code the app offers you on first sign-in.': 55,
  'The admin account signs in with this address.': 56,
  // actions/settings.ts
  'Time Zone': 57,
  'An IANA time zone such as Europe/London or America/New_York. Cycle entries are dates, so this decides where the server’s day starts.': 58,
  'Must be UTC or an IANA zone name such as Europe/London': 59,
  Language: 60,
  'The language the app is shown in.': 61,
  'Daily Reminder Pass': 62,
  'Lets Ovumcy check once a day whether anyone is due a reminder and send it to the webhook they configured. It does nothing until someone sets a webhook URL in the app’s own Settings. StartOS has no cron, so leaving this off means webhook reminders never fire.': 63,
  'Reminder Hour': 64,
  'The local hour the daily pass runs at, in the time zone above.': 65,
  'hour of day': 66,
  'Block Private Webhook Targets': 67,
  'Refuses to deliver reminders to private or internal addresses. Leave this off if the ntfy or Gotify you send to runs on this same server or your LAN — turning it on would block exactly that.': 68,
  'Audit Log': 69,
  'Writes a line per security-relevant action to the service log. The lines carry account ids and roles, so treat the log as being as sensitive as the database. For investigating something specific, not for everyday use.': 70,
  Settings: 71,
  'Time zone, language, daily reminders and logging. Everything each person tracks is set inside the app, not here.': 72,
  // actions/toggleRegistration.ts
  'Close Registration': 73,
  'Open Registration': 74,
  'Anyone who can reach this service can currently create their own account. Run this to close it.': 75,
  'Accounts are currently created by you, with Create Account. Run this to let people sign themselves up instead.': 76,
  'New accounts can no longer be created from the sign-in page. Existing accounts are unaffected.': 77,
  'Anyone who can reach your LAN address or your onion address will be able to create an account on this server.': 78,
  // init/watchCredentials.ts
  'Create the admin account before anyone can sign in. This generates its password and applies it to Ovumcy.': 79,
  // interfaces.ts
  'Web Interface': 80,
  'The Ovumcy calendar and settings. Everyone with an account on this server signs in here.': 81,
  // main.ts
  'The web interface is ready': 82,
  'The web interface is not ready': 83,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
