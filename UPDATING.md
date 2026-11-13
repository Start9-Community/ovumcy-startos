# Updating the upstream version

Upstream is the prebuilt image `ghcr.io/ovumcy/ovumcy-web`. Nothing is built from source and there is no submodule — but the image this package ships is built from the root `Dockerfile`, which copies upstream's `/app/ovumcy` binary, unmodified and pinned by digest, onto an alpine base.

## The password probe

No StartOS action has a controlling terminal, so every account action in this package depends on upstream reading the password as the first line of piped stdin. `v1.9.2` could not, which is why this package pinned a main-branch commit until `v2.2.1`. Treat that as a standing regression test rather than history: run it against each candidate image before repinning, because the check is behavioral and a changelog read will not catch it.

```bash
printf 'Throwaway-Pass-1!\n' | docker run --rm -i \
  -v "$PWD/probe-data:/app/data" -v "$PWD/probe-fence:/app/fence" \
  -e SECRET_KEY=probe-probe-probe-probe-probe-probe-probe \
  -e DB_DRIVER=sqlite -e DB_PATH=/app/data/ovumcy.db \
  -e CALENDAR_FEED_FENCE_PATH=/app/fence/calendar-feed.fence \
  ghcr.io/ovumcy/ovumcy-web:<candidate> /app/ovumcy users create probe@example.com
```

Then start that image once (so it writes the fence), stop it, and run `reset-password probe@example.com` the same way. If either answers `secure password prompt requires an interactive terminal`, that release cannot carry this package — `set-admin-password`, `create-account` and `reset-account-password` all break. Throw the probe directories away afterwards.

Since 2.0 the image also sets `CALENDAR_FEED_FENCE_REQUIRE_MOUNT=true`, so the probe needs its `/app/fence` bind mount; the digest-pinned stage in this package's `Dockerfile` copies only the binary and inherits none of upstream's `ENV`.

## Determining the upstream version

The pin lives in the root `Dockerfile`, as the `FROM … AS upstream` line — a release tag **and** the digest it resolved to. Both move together; `startos/manifest/index.ts` just says `dockerBuild: {}`.

The latest upstream release:

```bash
gh release view -R ovumcy/ovumcy-web --json tagName -q .tagName
```

Confirm that tag actually has a published image for the architectures this package declares before pinning it — a release can exist before its image does:

```bash
docker manifest inspect ghcr.io/ovumcy/ovumcy-web:<tag> | jq -r '.manifests[].platform.architecture'
```

**Releases lag the default branch.** Upstream commits heavily between tags, so the newest release can be months behind `main`. Track tags anyway: a tag is a point upstream chose to stand behind, and its migrations and docs match. Pinning a `sha-` commit build is a last resort for a defect that makes the package unusable — as the password probe once was — and it is carried only until a release contains the fix.

## Applying the bump

1. Read upstream's `CHANGELOG.md` and the release notes between the pinned tag and the new one. Three things in particular change what this package has to do:
   - **New or changed environment variables.** Ovumcy has no config file; everything is environment. A new variable this package does not pass is silently left at the application's own default, which may not be the choice this package made. `appEnv` in `startos/utils.ts` is the list to reconcile, and the table in `README.md` § File Models and the `startos_managed_env_vars` block document it.
   - **Operator CLI changes.** `startos/actions/` drives `users create`, `users list`, `users delete`, `reset-password` and `notify`. A changed flag, prompt order or stdin convention breaks an action quietly — `users create` and `reset-password` in particular read the password as the first line of piped stdin.
   - **Migrations that refuse to run, or downgrade caveats.** Upstream documents both in `docs/self-hosted.md`.
2. Update the `FROM … AS upstream` line in the root `Dockerfile` — tag and digest together. Read the digest off the registry rather than trusting the tag:

   ```bash
   docker buildx imagetools inspect ghcr.io/ovumcy/ovumcy-web:<tag> --format '{{.Manifest.Digest}}'
   ```
3. Bump `startos/versions/current.ts` to the new upstream version with a fresh `:0` revision, and move the version it replaces into its own file under `startos/versions/`, listed in the `other` array of `startos/versions/index.ts` — that array is the migration path for an install still on it. While a pin is a commit build, the version's base stays at the release it descends from.
4. Reconcile the i18n dictionaries if any user-facing string changed. `startos/i18n/dictionaries/default.ts` is keyed by index, so append rather than insert, and when the English text of an existing key changes, update that same index in every locale in `translations.ts`.

## Architecture

Pin the digest of the image **index**, not of one platform's manifest: a single-platform digest breaks the ARM build. `docker buildx imagetools inspect <ref>` shows which kind you have.
