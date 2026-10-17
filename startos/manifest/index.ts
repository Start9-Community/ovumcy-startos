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
      // Built from ./Dockerfile: the upstream binary, copied by digest out of
      // the upstream image, onto an alpine base. Upstream's own image is
      // FROM scratch and has no /proc, so StartOS cannot start a subcontainer
      // from it at all. The Dockerfile explains the rest, including why the
      // upstream build it copies from is a commit rather than a release tag.
      source: { dockerBuild: {} },
      // Both halves of the Dockerfile are multi-arch: the pinned upstream
      // digest is an image index carrying linux/amd64 and linux/arm64, and so
      // is the alpine base, so each arch builds against its own binary.
      arch: ['x86_64', 'aarch64'],
    },
  },
})
