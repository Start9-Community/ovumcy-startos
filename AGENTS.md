# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

## Changing this package

**The image has no shell.** It is `FROM scratch` around a static Go binary. Anything reaching for `sh -c`, `chown`, `cat` or a coreutils binary will fail at runtime, not at build time. Commands are exec'd directly as argv arrays; ownership is handled by the `idmap` on the volume mounts in `startos/utils.ts`, not by a chown oneshot.

**Passwords go on stdin.** `users create` and `reset-password` read the password as the first line of piped stdin and refuse argv and the environment. That is what `asStdin` and `runCli(…, input)` exist for. Do not "simplify" it into an argument or an env var: it is an upstream invariant, and breaking it leaks credentials into process lists and logs.

**The fence volume must stay out of backups.** `startos/backups.ts` backs up `main` and `startos` and not `fence`, and the comment there explains why. Adding `fence` to `ofVolumes` looks like a fix for "a volume isn't backed up" and silently defeats calendar-feed revocation across restores.

**`store.json` is read as a projection in `main.ts`.** The mapper deliberately excludes `adminPassword`, so that setting or rotating it does not restart the daemon. If you add a key the daemon's environment depends on, add it to both `AppConfig` in `startos/fileModels/store.json.ts` and the mapper in `startos/main.ts` — the type makes the first half of that mandatory, nothing enforces the second.

**`AppConfig` is spelled out rather than derived.** `Store` comes from a `z.looseObject`, which carries an index signature, and `Omit<Store, …>` over an index signature discards every named property — leaving every environment value typed `unknown`. If you find yourself "tidying" that type into an `Omit`, `tsc` will tell you why not.

**Read before writing in action handlers.** Handlers use `.once()`; action *metadata* uses `.const(effects)`. A handler that reads with `.const` and then writes the same file hits the SDK's write-after-const guard.

**Account state is asked, not inferred.** `setAdminPassword` runs `users list` to decide between `users create` and `reset-password`, rather than branching on whether the store holds a password. The store and the database can legitimately disagree — a restored backup, an account deleted inside the app.

## Verification

This package has never been installed on a StartOS box (`PLAN.md` records the decisions behind it and the risks it was built against). `tsc` and `make x86` passing proves it compiles and packs, nothing more. Before trusting any of it, work the verification protocol from the `package-service` skill in your packaging workspace (`.claude/skills/package-service/references/verify-on-startos.md`; the published guide is at <https://docs.start9.com/packaging>). Treat these as the specific unknowns:

- whether `idmap: [{ fromId: 0, toId: 10001 }]` is the correct direction for a volume the non-root app must write;
- whether `users create` / `reset-password` accept the password as one piped line, or want it twice as the interactive prompt does;
- whether the CLI can open the SQLite database while the daemon holds it, for actions run on a running service;
- whether `COOKIE_SECURE=true` lets sign-in work over `http://…onion` in Tor Browser, as the secure-context rules imply.
