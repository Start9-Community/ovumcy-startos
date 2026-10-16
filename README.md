<p align="center">
  <img src="icon.svg" alt="Ovumcy Logo" width="21%">
</p>

# Ovumcy on StartOS

> Everything not listed in this document should behave the same as upstream Ovumcy.
> If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation section of
> `instructions.md` for links.

[Ovumcy](https://github.com/ovumcy/ovumcy-web) is a self-hosted period and menstrual cycle tracker: a calendar for period start and end days, flow intensity, symptoms and notes, with cycle-phase and prediction views. It is a Go binary serving server-rendered HTML over HTTP, with SQLite for storage, and it supports multiple accounts whose health data is isolated per account.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The upstream image is used unmodified, pinned by tag in `startos/manifest/index.ts`. It is built `FROM scratch` around a static Go binary — there is no shell, no package manager and no coreutils inside it, which is worth knowing before writing any oneshot or action that assumes one. It carries `/etc/passwd` and `/etc/group` (so a named user resolves), CA certificates and zoneinfo, and nothing else.

The pin is a **main-branch commit, not a release tag**. The newest upstream release cannot reset a password without a controlling terminal, and there is no terminal behind a StartOS action, which would leave account recovery — the thing an admin needs when someone is locked out — unreachable. The pinned commit is immutable and carries upstream's non-interactive path. `UPDATING.md` records when to move back to a release tag.

| What             | Detail                                                                        |
| ---------------- | ----------------------------------------------------------------------------- |
| Image source     | Upstream, unmodified, from GHCR                                               |
| Architectures    | x86_64                                                                        |
| Entrypoint       | The image's `CMD` named explicitly as `/app/ovumcy`; it declares no ENTRYPOINT |
| Process user     | `root` **inside the subcontainer**, set explicitly on every command            |

Running as root is a deviation from upstream, which ships `USER 10001`, and it is forced. StartOS mounts volumes root-owned on every start, so a uid-10001 process cannot write its own database, and both documented remedies are unavailable: a `chown` oneshot needs a `chown` binary this image does not contain, and an `idmap` on the mount is refused by the host (`open_tree_attr IDMAP: Operation not permitted`). The remaining options were namespaced root in a single-service container whose only writable mounts are this service's own volumes, or rebuilding the upstream binary into an image carrying busybox — which would discard the Cosign signature and SLSA provenance attached to the upstream image. For a health-data service the signed image mattered more.

Two subcontainers:

- **`ovumcy-sub`** — the long-running daemon. Attach to it to watch the server: `start-cli package attach ovumcy -n ovumcy-sub`.
- **`ovumcy-cli`** — created and torn down by each account-management action, which runs the upstream operator CLI (`/app/ovumcy users …`, `reset-password`, `notify`) against the same data volume. It is not running between actions.

Volume mounts carry no `idmap`; the daemon and every command run as root in the container instead, for the reason above.

## Volume and Data Layout

Three volumes, which is one more than this service looks like it needs; the third exists so that backups can leave it out.

| Volume    | Mounted at   | Holds                                                                  |
| --------- | ------------ | ---------------------------------------------------------------------- |
| `main`    | `/app/data`  | `ovumcy.db`, the SQLite database — all accounts and all health data    |
| `fence`   | `/app/fence` | `calendar-feed.fence`, the calendar-feed restore fence                 |
| `startos` | not mounted  | `store.json` — this package's own state, never visible to the app      |

The database is embedded SQLite. Upstream also supports Postgres; this package does not use it.

The fence is a single small file whose whole purpose is to not be in a backup. Ovumcy compares it against the database to tell whether the database in front of it is the one this instance last wrote. Keeping it on its own volume, excluded from backups, is what makes a revoked calendar-feed URL stay revoked across a restore. If the directory is ever unwritable the app fails closed — it disarms every armed feed on each start and logs that it did.

`store.json` is deliberately on a volume no subcontainer mounts: it holds the application secret and the admin password this package generates, and the application has no reason to be able to read either.

## File Models

One model, and it maps nothing upstream owns.

| Model        | File                     | Format | Seeded                                     | Rewritten by                        | Hand edits                               |
| ------------ | ------------------------ | ------ | ------------------------------------------ | ----------------------------------- | ---------------------------------------- |
| `store.json` | `startos` volume, `store.json` | JSON | Written in full on install by `startos/init/seedStore.ts` | The actions that change settings or credentials | Survive if valid; an invalid value is replaced by its schema default on the next write |

Ovumcy reads **no configuration file at all** — it is configured entirely by environment variables, which is why there is no model of an upstream config here and nothing on disk to correct by hand. `startos/utils.ts` turns `store.json` into that environment on every launch, so every value in it is re-asserted at each start; none of them is a value the user owns inside the container. A setting changed through an action restarts the daemon, which is how it takes effect.

The admin password is stored but is **not** part of the environment: it lives in Ovumcy's own database, applied through the upstream CLI. That is why rotating it does not restart the service, and why `startos/main.ts` reads a projection of the store that excludes it.

## Dependencies

None.

## Network Access and Interfaces

One interface, serving the whole application — calendar, per-account settings, and the calendar-feed endpoint.

| Interface | Type | Port | Protocol | Purpose                                                           |
| --------- | ---- | ---- | -------- | ----------------------------------------------------------------- |
| `ui`      | `ui` | 8080 | HTTP     | The web application: sign-in, calendar, per-account settings, `.ics` feeds |

StartOS terminates TLS and forwards plain HTTP, so the container always sees `http` regardless of how the browser reached it. The session cookie's `Secure` flag is therefore a package setting rather than something derived from the request — see `cookieSecure` in the store and the **Allow Sign-In Over Plain HTTP** action. The practical consequence is that sign-in works from an https LAN address or from Tor Browser over `.onion`, and silently fails from a plain `http://` LAN address until that action is run.

Client IP addresses are not recoverable: the package binds plain HTTP, so no `X-Forwarded-*` header is added, and over Tor every client arrives through the local Tor daemon anyway. `TRUST_PROXY_ENABLED` is therefore off — trusting a header that may be appended rather than overwritten would make every per-IP limit spoofable. Because upstream's per-IP login budget is consequently shared by everyone on the server, the package raises that one budget (see [Limitations and Differences](#limitations-and-differences)).

## Installation and First-Run Flow

Install generates the application secret into `store.json` and leaves the service unable to start until an admin account exists.

That block is deliberate. Upstream's own first-run path lets whoever reaches the address first create an account, so this package closes registration by default and creates the admin account itself: the install-time watcher raises a critical task, **Set Admin Password** generates a password, applies it through the upstream CLI (`users create`, or `reset-password` if that account already exists), stores it and returns it. Only then does the daemon start, and by then sign-up is closed.

Ordering constraint: nothing else is runnable until that task is satisfied, and the credential it returns is shown once per run of the action.

## Actions

Ten actions, in three groups: the package's own credential, account management for other people, and server settings. The account actions each spin up a throwaway subcontainer and run the upstream operator CLI against the live database — passwords reach it on stdin, never in argv or the environment. All of them work whether the service is running or stopped.

| Action                   | When to run it                                                                    | What it changes                                              | Cost / repeat safety                                                                      |
| ------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `set-admin-password`     | First install, or to rotate the admin credential                                  | The admin row in the database, and `adminPassword` in the store | Seconds. Safe to repeat — each run replaces the password and signs that account out. On a rotation the returned password is good for **one** sign-in: upstream then requires a new one (see below) |
| `create-account`         | Adding another person to the server                                               | Inserts an account in the database                           | Seconds. **Not** idempotent: a second run for the same address fails, by upstream design   |
| `list-accounts`          | Before any action that needs an address or id; auditing who exists                | Nothing                                                      | Seconds, read-only, repeatable                                                             |
| `reset-account-password` | Someone has lost both their password and their recovery code                      | That account's password hash and session version; the store too if the address is the admin's | Seconds. Safe to repeat. Signs that account out everywhere                                  |
| `delete-account`         | Removing someone, including their health record                                   | Deletes the account and all of its data                       | Seconds. **Destructive and irreversible**; a second run fails because the account is gone   |
| `toggle-registration`    | Opening sign-up for a trusted household, or closing it again                      | `registrationOpen` in the store                               | Seconds, restarts the daemon. Idempotent per direction                                      |
| `settings`               | Setting the time zone, language, reminder schedule, webhook guard or audit logging | The corresponding keys in the store                           | Seconds, restarts the daemon. Idempotent                                                    |
| `run-reminder-pass`      | Checking that a newly configured webhook actually delivers                         | Nothing stored; sends outbound webhook requests               | Seconds. Safe to repeat, but each run really does notify everyone currently due              |
| `allow-insecure-cookies` | Sign-in must work over a plain `http://` LAN address                              | `cookieSecure` in the store                                   | Seconds, restarts the daemon. Idempotent per direction. Weakens session security             |
| `rotate-app-secret`      | The application secret is believed to have leaked                                 | `secretKey` in the store                                      | Seconds, restarts the daemon. Safe to repeat and **costly**: every session, TOTP enrolment, stored webhook URL and feed URL is invalidated |

No action is hidden; all ten are user-facing.

**A CLI-set password is single-use; a CLI-created account's is not.** Upstream distinguishes the two, and so do the actions' result messages. After `reset-password` — which is what `set-admin-password` runs once the admin account exists, and all of `reset-account-password` — the next sign-in is redirected straight to a forced password change, so the value the action returned stops working after it. After `users create` the account signs in and goes to onboarding with the password it was given. The practical consequence: the store's `adminPassword` goes stale the moment a rotated admin signs in and chooses their own, and that is upstream behavior, not drift.

**`reset-password` needs the fence marker, which only a started server writes.** On a never-started install the command refuses, naming the fence. This never bites in practice, because the only path that runs before the first start is the `users create` branch of `set-admin-password` — but it is why that action asks Ovumcy which branch it is on rather than assuming.

Three upstream CLI capabilities are deliberately not exposed as actions: `users set-email` (repair for a legacy-format address), `repair symptom-names` (a break-glass data repair for a migration that refuses to run), and `webhook set` (each person sets their own webhook inside the app). Each is a one-file addition if a real need appears.

## Tasks

One task, and it is the reason a fresh install does not start on its own.

- **Set the admin password** — raised by `startos/init/watchCredentials.ts` whenever `store.json` has no `adminPassword`. Severity **critical**, so the service will not start and the ordinary controls are replaced by the prompt. Cleared by running `set-admin-password`, which writes that key. It can return: if the store is restored from a backup taken before the password was set, or the key is otherwise absent, the task comes back.

## Health Checks

One check, on the daemon itself.

- **Web Interface** — `checkPortListening` on 8080, with a 30-second grace period. Within the grace window a failure reads as "starting", which covers the first start of a fresh install: the binary applies database migrations before it listens, and on a new install it creates the database first.

A failure after that window means the process is up but not listening, or has exited — the service log is the next place to look. The most likely causes are a `store.json` with no `secretKey` (the daemon refuses to start and says so) and an unwritable `/app/data` (the id-remap on the mount is what normally prevents this).

## Backups and Restore

The strategy is whole-volume snapshots of `main` and `startos`, taken with the service stopped, so the SQLite file is quiescent while it is copied and no dump or checkpoint step is involved. Both volumes have to be in it: a database restored without the secret that sealed its sessions, TOTP secrets, webhook URLs and feed URLs would have none of those readable.

`fence` is excluded on purpose, and this is the one place where a restore is intentionally not a faithful rewind. After a restore the fence no longer matches the database in front of it, so Ovumcy disarms every armed calendar feed on its next start and logs that it did. That is what stops a feed URL someone revoked from coming back live when an older database is restored. Each account re-generates the subscribe URLs it still wants from the app's own settings; nothing else needs doing.

## Limitations and Differences

1. **x86_64 only.** Upstream publishes an arm64 image too; this package does not yet declare that architecture, so on ARM hardware it would fall to emulation.
2. **The service runs as root inside its container**, where upstream runs as uid 10001 — see [Image and Container Runtime](#image-and-container-runtime) for why, and what the alternative would have cost.
3. **The image is pinned to a main-branch commit rather than a release**, so this package is ahead of upstream's newest tag. Without it, account recovery does not work at all on StartOS.
4. **No email, so no self-service password reset.** The package configures no SMTP. Account recovery is the recovery code Ovumcy issues at account creation, or the `reset-account-password` action.
5. **OIDC / SSO is disabled** (`OIDC_ENABLED=false`) and not exposed. It would need HTTPS to the container plus a redirect URL, and auto-provisioning would add a second route to account creation beside this package's actions.
6. **Postgres is not supported.** SQLite only, which is upstream's own recommended baseline for a single private deployment.
7. **The per-IP login budget is widened** from upstream's 8 attempts per 15 minutes to 40. Client IPs cannot be distinguished behind the OS proxy, and over Tor they genuinely are one address, so the stock budget is shared by the whole household and would lock everyone out together. Nothing else is relaxed — the per-account logout budget and the deliberately tight calendar-feed budget keep upstream's defaults.
8. **HSTS is off** (`HSTS_ENABLED=false`), where upstream defaults it to whatever `COOKIE_SECURE` is. StartOS owns the edge, and pinning a `.local` or `.onion` host to HTTPS in visitors' browsers for a year is not this package's call.
9. **Sign-in over plain HTTP fails until an action is run.** `COOKIE_SECURE` is on by default; `allow-insecure-cookies` is the documented escape hatch.
10. **Registration is closed by default**, where upstream's default is open. `toggle-registration` reverses it.
11. **The daily reminder pass is on by default**, where upstream ships it off. StartOS gives a user no cron, so leaving it off would make webhook reminders unreachable. It stays inert until someone configures a webhook URL in the app.
12. **Three upstream CLI commands are not exposed** — `users set-email`, `repair symptom-names`, `webhook set` (see [Actions](#actions)).

---

## Quick Reference for AI Consumers

```yaml
package_id: ovumcy
image: ghcr.io/ovumcy/ovumcy-web
architectures: [x86_64]
subcontainers: [ovumcy-sub, ovumcy-cli]
volumes:
  main: /app/data
  fence: /app/fence
  startos: not mounted
file_models:
  - store.json
startos_managed_env_vars:
  - SECRET_KEY
  - DB_DRIVER
  - DB_PATH
  - CALENDAR_FEED_FENCE_PATH
  - PORT
  - REGISTRATION_MODE
  - TZ
  - DEFAULT_LANGUAGE
  - COOKIE_SECURE
  - HSTS_ENABLED
  - TRUST_PROXY_ENABLED
  - RATE_LIMIT_LOGIN_MAX
  - RATE_LIMIT_LOGIN_WINDOW
  - REMINDER_SCHEDULER_ENABLED
  - REMINDER_SCHEDULER_HOUR
  - AUDIT_LOG_ENABLED
  - WEBHOOK_BLOCK_PRIVATE_ADDRESSES
  - OIDC_ENABLED
dependencies: none
interfaces:
  ui: { type: ui, port: 8080 }
actions:
  - set-admin-password
  - create-account
  - list-accounts
  - reset-account-password
  - delete-account
  - toggle-registration
  - settings
  - run-reminder-pass
  - allow-insecure-cookies
  - rotate-app-secret
tasks:
  - { action: set-admin-password, severity: critical }
health_checks:
  - ovumcy
```
