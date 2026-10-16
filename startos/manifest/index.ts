import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'ovumcy',
  title: 'Ovumcy',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/nfealey/ovumcy-startos',
  upstreamRepo: 'https://github.com/ovumcy/ovumcy-web',
  marketingUrl: 'https://ovumcy.com/',
  donationUrl: null,
  description: { short, long },
  volumes: [
    // The SQLite database.
    'main',
    // store.json — the package's own state (app secret, admin credential,
    // settings). Mounted by nothing; see startos/fileModels/store.json.ts.
    'startos',
    // The calendar-feed restore fence. A volume of its own because it must NOT
    // be captured by backups: the fence is how the app tells a restored
    // database apart from the one it replaced, so a calendar feed an owner
    // revoked cannot come back live at its old URL after a restore. See
    // startos/backups.ts, which backs up 'main' and 'startos' only.
    'fence',
  ],
  images: {
    ovumcy: {
      // A main-branch build, pinned by commit, rather than the v1.9.2 release
      // tag. v1.9.2 predates upstream's non-interactive `reset-password`: it
      // demands a terminal, and there is no terminal behind a StartOS action,
      // which leaves the documented account-recovery path unreachable. This
      // tag is immutable (it names one commit) and is the same digest `latest`
      // resolved to when it was chosen. UPDATING.md says when to move back to
      // a release tag.
      source: { dockerTag: 'ghcr.io/ovumcy/ovumcy-web:sha-8918dac' },
      // Upstream publishes linux/amd64 and linux/arm64. This package ships
      // x86_64 only for now; adding 'aarch64' here is the whole change.
      arch: ['x86_64'],
    },
  },
})
