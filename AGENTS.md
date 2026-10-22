# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

## Changing this package

- **Keep the image built from the `Dockerfile`; don't repin `images.ovumcy` to upstream's `dockerTag`.** Upstream's image is `FROM scratch` with no `/proc`, so every start fails with `Failed to start subcontainer ovumcy`.
- **Keep both `chown`s — the oneshot in `main.ts` and the one at the top of `runCli`.** Volumes mount root-owned on every start, actions can run before the first start, and StartOS refuses an `idmap` mount.
- **Keep `TRUST_PROXY_ENABLED` and `TRUSTED_PROXIES` as they are in `appEnv`.** Without them fiber's CSRF check refuses every sign-in with a `403` that reads as a wrong password.
- **Passwords reach the CLI on stdin only** (`asStdin`), never argv or the environment — upstream refuses both.
- **Move the upstream pin back to a release tag only once that release passes the `reset-password` probe in `UPDATING.md`.** Bump the `FROM … AS upstream` tag and digest together.
- **Never add `fence` to `ofVolumes` in `backups.ts`** — a backed-up fence defeats calendar-feed revocation across a restore.
- **A new store key the daemon's environment depends on goes in both `AppConfig` and the projection in `main.ts`.** Only the first is type-checked.
