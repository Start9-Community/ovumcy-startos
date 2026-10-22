# Ovumcy

## Documentation

- [Cycle prediction](https://github.com/ovumcy/ovumcy-web/blob/main/docs/cycle-prediction.md) — how predicted dates and cycle phases are worked out
- [Notifications](https://github.com/ovumcy/ovumcy-web/blob/main/docs/notifications.md) — reminder banners, webhook reminders and calendar subscriptions
- [Data export](https://github.com/ovumcy/ovumcy-web/blob/main/docs/export.md) — exporting your own data out of Ovumcy
- [Data rights and deletion](https://github.com/ovumcy/ovumcy-web/blob/main/docs/gdpr.md) — what is stored per account and how it is deleted

## What you get on StartOS

One web interface with a calendar as its main view. Mark the day a period starts and the day it ends, log how heavy the flow is, add symptoms, mood and notes, and see cycle phases and predicted dates.

Accounts are separate. Each person signs in with their own email address and password, and nobody — including you — can see another account's calendar, symptoms or notes from inside the app. The account actions below let you create, reset and delete accounts and list who exists, but never read what anyone tracks.

Sign-up from the login page is closed. You hand out accounts with **Create Account**, which is what keeps someone who finds the address from making themselves an account on your server.

This server sends no email. That matters in one place: there is no "forgot my password" email. Each person gets a recovery code when their account is created — tell them to keep it — and if that is lost too, you can set them a new password with **Reset Account Password**.

## Getting set up

1. Run **Set Admin Password**. It creates the admin account, generates its password and shows it once — save it somewhere safe. The service will not start until this is done.
2. Start the service and open the **Web Interface**.
3. Sign in as `admin@ovumcy.local` with that password, and save the recovery code the app offers you.
4. Run **Create Account** once for each other person who will use it. Give each of them their email, password and recovery code privately, and have them change the password in the app's own Settings afterwards.

### Reaching it securely

Sign-in needs a secure address, which means one of:

- the **https** LAN address, after trusting your server's Root CA on the device you are using — the usual choice at home;
- your **.onion** address opened in **Tor Browser**, which treats onion addresses as secure.

Signing in over a plain `http://` LAN address will silently fail: the browser throws the session cookie away. If you genuinely need that, turn off **Require A Secure Connection To Sign In** in **Settings** and read its warning first.

## Using Ovumcy

### Web interface

A sign-in page, then the calendar. Everything each person tracks lives in the app itself — tap a day to record a period start or end, how heavy the flow was, symptoms and notes. Each account's own Settings inside the app is where that person sets their reminder lead time, their reminder webhook and their private calendar subscription link.

### Reminders

Three kinds, all driven by the same prediction: a banner in the app, a push to a webhook, and a private read-only calendar feed you can subscribe to from a phone or desktop calendar.

Webhook reminders go to a notification server you run — ntfy or Gotify, for example. Each person sets their own webhook URL in the app's Settings; nothing is sent until they do. A daily pass checks who is due and sends them; set the hour it runs, and the time zone that hour is in, in **Settings**. To check a webhook works without waiting for tomorrow, run **Send Reminders Now**.

### Managing accounts

These actions are grouped under **Account**.

- **Create Account** — add someone. Generates their password, and prints their recovery code if you ask it to.
- **Reset Account Password** — for someone locked out of their account; pick the account from the list. Signs that account out everywhere.
- **Delete Account** — removes someone's account **and everything it tracked**. It asks you to confirm because there is no undo short of restoring a backup. Each person can also delete their own account from the app.
- **Set Admin Password** — run it again any time to rotate your own password.
- **Open Registration**, in **Settings** — lets people sign themselves up instead of waiting for you. Anyone who can reach the address can then create an account.

### Backups

A StartOS backup captures the database and the account you signed in with. One thing behaves deliberately differently: any private calendar subscription link that someone revoked stays dead after a restore, and the links that were live are disarmed as a precaution. Each person re-generates theirs from the app's Settings afterwards.
