# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

## Changing this package

**The image has no shell.** It is `FROM scratch` around a static Go binary. Anything reaching for `sh -c`, `chown`, `cat` or a coreutils binary will fail at runtime, not at build time. Commands are exec'd directly as argv arrays.

**Everything runs as root in the container, and `idmap` is not an option.** An earlier revision mounted the volumes with `idmap: [{ fromId: 0, toId: 10001 }]` so the app could keep upstream's uid 10001. StartOS refuses it: `start-container bind-mount … --idmap 0:10001:1` fails with `open_tree_attr IDMAP: Operation not permitted`. With no `chown` in the image either, root is what is left — see `appUser` in `startos/utils.ts` for the full reasoning, including why rebuilding the binary into a busybox image is the worse trade.

**Passwords go on stdin.** `users create` and `reset-password` read the password as the first line of piped stdin and refuse argv and the environment. That is what `asStdin` and `runCli(…, input)` exist for. Do not "simplify" it into an argument or an env var: it is an upstream invariant, and breaking it leaks credentials into process lists and logs.

**The image pin is a commit, deliberately.** `reset-password` only accepts piped stdin in builds after v1.9.2 — the release demands a controlling terminal, which no action has. Moving the pin back to a release tag before upstream tags one containing that change silently breaks both reset paths; `UPDATING.md` has the condition to watch for.

**The fence volume must stay out of backups.** `startos/backups.ts` backs up `main` and `startos` and not `fence`, and the comment there explains why. Adding `fence` to `ofVolumes` looks like a fix for "a volume isn't backed up" and silently defeats calendar-feed revocation across restores.

**`store.json` is read as a projection in `main.ts`.** The mapper deliberately excludes `adminPassword`, so that setting or rotating it does not restart the daemon. If you add a key the daemon's environment depends on, add it to both `AppConfig` in `startos/fileModels/store.json.ts` and the mapper in `startos/main.ts` — the type makes the first half of that mandatory, nothing enforces the second.

**`AppConfig` is spelled out rather than derived.** `Store` comes from a `z.looseObject`, which carries an index signature, and `Omit<Store, …>` over an index signature discards every named property — leaving every environment value typed `unknown`. If you find yourself "tidying" that type into an `Omit`, `tsc` will tell you why not.

**Read before writing in action handlers.** Handlers use `.once()`; action *metadata* uses `.const(effects)`. A handler that reads with `.const` and then writes the same file hits the SDK's write-after-const guard.

**Account state is asked, not inferred.** `setAdminPassword` runs `users list` to decide between `users create` and `reset-password`, rather than branching on whether the store holds a password. The store and the database can legitimately disagree — a restored backup, an account deleted inside the app.

## Verification

`PLAN.md` § 7 records what has been established and how. The upstream contract this package depends on was verified directly against the pinned image, outside StartOS:

- `users create` accepts the password as **one** piped line, and works on a database that does not exist yet (it creates and migrates it);
- `reset-password` accepts one piped line too, in builds after v1.9.2, but refuses until a started server has written the fence marker;
- both, plus `users list`, work **while the daemon holds the database** — concurrent SQLite access is fine;
- the daemon runs, listens and arms the fence as **root**;
- a password set by either command is accepted by the real web login (a wrong one is rejected), and a reset forces a password change at next sign-in while a freshly created account goes to onboarding.

What that does **not** cover is everything StartOS-side, which has never run: install and update, the critical task gating startup, health-check transitions, the interface and its addresses, `COOKIE_SECURE` over an onion address in Tor Browser, and the backup/restore round-trip including the fence's disarm-on-restore behavior. Work the verification protocol from the `package-service` skill in your packaging workspace (`.claude/skills/package-service/references/verify-on-startos.md`; the published guide is at <https://docs.start9.com/packaging>).
