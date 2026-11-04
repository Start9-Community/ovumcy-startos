# Updating the upstream version

Upstream is the prebuilt image `ghcr.io/ovumcy/ovumcy-web`. Nothing is built from source and there is no submodule — but the image this package ships is built from the root `Dockerfile`, which copies upstream's `/app/ovumcy` binary, unmodified and pinned by digest, onto an alpine base.

## The pin is currently a commit, not a release

`v1.9.2` — the newest release when this package was written — cannot reset a password without a controlling terminal, and no StartOS action has one. The pin is therefore `sha-d28ddba`, a main-branch build carrying upstream's non-interactive `reset-password`; `sha-` tags name one commit each, so the pin is immutable.

**Move back to a release tag as soon as one contains that change.** The test is behavioral, not a changelog read — run it against the candidate image before repinning:

```bash
printf 'Throwaway-Pass-1!\n' | docker run --rm -i \
  -v "$PWD/probe-data:/app/data" -v "$PWD/probe-fence:/app/fence" \
  -e SECRET_KEY=probe -e DB_DRIVER=sqlite -e DB_PATH=/app/data/ovumcy.db \
  -e CALENDAR_FEED_FENCE_PATH=/app/fence/calendar-feed.fence \
  ghcr.io/ovumcy/ovumcy-web:<candidate> /app/ovumcy users create probe@example.com
```

Then start that image once (so it writes the fence), stop it, and run `reset-password probe@example.com` the same way. If it answers `secure password prompt requires an interactive terminal`, that release still predates the fix — stay on the commit pin. Throw the probe directories away afterwards.

## Determining the upstream version

The pin lives in the root `Dockerfile`, as the `FROM … AS upstream` line — a `sha-`/release tag **and** the digest it resolved to. Both move together; `startos/manifest/index.ts` just says `dockerBuild: {}`.

The latest upstream release:

```bash
gh release view -R ovumcy/ovumcy-web --json tagName -q .tagName
```

Confirm that tag actually has a published image for the architectures this package declares before pinning it — a release can exist before its image does:

```bash
docker manifest inspect ghcr.io/ovumcy/ovumcy-web:<tag> | jq -r '.manifests[].platform.architecture'
```

**Releases lag the default branch.** Upstream commits heavily between tags, so the newest release can be months behind `main`. Track tags: a tag is a point upstream chose to stand behind, and its migrations and docs match. The current commit pin is the one exception, for the reason above; don't add another.

## Applying the bump

1. Read upstream's `CHANGELOG.md` and the release notes between the pinned tag and the new one. Three things in particular change what this package has to do:
   - **New or changed environment variables.** Ovumcy has no config file; everything is environment. A new variable this package does not pass is silently left at the application's own default, which may not be the choice this package made. `appEnv` in `startos/utils.ts` is the list to reconcile, and the table in `README.md` § File Models and the `startos_managed_env_vars` block document it.
   - **Operator CLI changes.** `startos/actions/` drives `users create`, `users list`, `users delete`, `reset-password` and `notify`. A changed flag, prompt order or stdin convention breaks an action quietly — `users create` and `reset-password` in particular read the password as the first line of piped stdin.
   - **Migrations that refuse to run, or downgrade caveats.** Upstream documents both in `docs/self-hosted.md`.
2. Update the `FROM … AS upstream` line in the root `Dockerfile` — tag and digest together. Read the digest off the registry rather than trusting the tag:

   ```bash
   docker buildx imagetools inspect ghcr.io/ovumcy/ovumcy-web:<tag> --format '{{.Manifest.Digest}}'
   ```
3. While the pin is a commit build, the version's base in `startos/versions/current.ts` stays at the release it descends from.

## Architecture

Pin the digest of the image **index**, not of one platform's manifest: a single-platform digest breaks the ARM build. `docker buildx imagetools inspect <ref>` shows which kind you have.
