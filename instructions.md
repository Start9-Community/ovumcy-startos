# Ovumcy

Everyone who tracks on this server gets their own account, and you create those accounts. Start with **Set Admin Password** — until you run it there is no account to sign in to, and nobody else can claim one either.

## Documentation

- [Cycle prediction](https://github.com/ovumcy/ovumcy-web/blob/main/docs/cycle-prediction.md) — how predicted dates and cycle phases are worked out
- [Notifications](https://github.com/ovumcy/ovumcy-web/blob/main/docs/notifications.md) — reminder banners, webhook reminders and calendar subscriptions
- [Data export](https://github.com/ovumcy/ovumcy-web/blob/main/docs/export.md) — exporting your own data out of Ovumcy
- [Data rights and deletion](https://github.com/ovumcy/ovumcy-web/blob/main/docs/gdpr.md) — what is stored per account and how it is deleted

## What you get on StartOS

One web interface with a calendar as its main view. Mark the day a period starts and the day it ends, log how heavy the flow is, add symptoms, mood and notes, and see cycle phases and predicted dates.

Accounts are separate. Each person signs in with their own email address and password, and nobody — including you — can see another account's calendar, symptoms or notes from inside the app. Your admin account can create, rename, reset and delete accounts, and list who exists, but not read what they track.

Sign-up from the login page is closed. You hand out accounts with **Create Account**, which is what keeps someone who finds the address from making themselves an account on your server.

This server sends no email. That matters in one place: there is no "forgot my password" email. Each person gets a recovery code when their account is created — tell them to keep it — and if that is lost too, you can set them a new password with **Reset Account Password**.

## Getting set up

1. Run **Set Admin Password**. It creates the admin account, generates its password and shows it once — save it somewhere safe. The service will not start until this is done.
2. Start the service and open the **Web Interface**.
3. Sign in as `admin@ovumcy.local` with that password, and save the recovery code the app offers you.
4. Open **Settings** (the StartOS action) and set your **Time Zone**. Entries are dates, so this decides when the server's day rolls over. Set the language here too if English isn't what you want.
5. Run **Create Account** once for each other person who will use it. Give each of them their email, password and recovery code privately, and have them change the password in the app's own Settings afterwards.

### Reaching it securely

Sign-in needs a secure address, which means one of:

- the **https** LAN address, after trusting your server's Root CA on the device you are using — the usual choice at home;
- your **.onion** address opened in **Tor Browser**, which treats onion addresses as secure.

Signing in over a plain `http://` LAN address will silently fail: the browser throws the session cookie away. If you genuinely need that, run **Allow Sign-In Over Plain HTTP** and read its warning first.

## Using Ovumcy

### Web interface

A sign-in page, then the calendar. Everything each person tracks lives in the app itself — tap a day to record a period start or end, how heavy the flow was, symptoms and notes. Each account's own Settings inside the app is where that person sets their reminder lead time, their reminder webhook and their private calendar subscription link.

### Reminders

Three kinds, all driven by the same prediction: a banner in the app, a push to a webhook, and a private read-only calendar feed you can subscribe to from a phone or desktop calendar.

Webhook reminders go to a notification server you run — ntfy or Gotify, for example. Each person sets their own webhook URL in the app's Settings; nothing is sent until they do. A daily pass checks who is due and sends them, and you can set the hour it runs in **Settings**. To check a webhook works without waiting for tomorrow, run **Send Reminders Now**.

### Managing accounts

- **Create Account** — add someone. Generates their password, and prints their recovery code if you ask it to.
- **List Accounts** — who exists, with their ids and email addresses. No cycle data.
- **Reset Account Password** — for someone locked out of their account. Signs that account out everywhere.
- **Delete Account** — removes the account **and everything it tracked**. It asks you to confirm because there is no undo short of restoring a backup.
- **Set Admin Password** — run it again any time to rotate your own password.
- **Open Registration** — lets people sign themselves up instead of waiting for you. Anyone who can reach the address can then create an account; run **Close Registration** to stop that again.

### Backups

A StartOS backup captures the database and the account you signed in with. One thing behaves deliberately differently: any private calendar subscription link that someone revoked stays dead after a restore, and the links that were live are disarmed as a precaution. Each person re-generates theirs from the app's Settings afterwards.

## Limitations

Predictions are estimates. They are not medical advice and not a method of contraception.
