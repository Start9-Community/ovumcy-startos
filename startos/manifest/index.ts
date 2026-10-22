import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'ovumcy',
  title: 'Ovumcy',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/Start9-Community/startos-ovumcy',
  upstreamRepo: 'https://github.com/ovumcy/ovumcy-web',
  marketingUrl: 'https://ovumcy.com/',
  donationUrl: null,
  description: { short, long },
  volumes: [
    'main',
    'startos',
    // Kept out of backups so a restore can tell a restored database from the one it replaced.
    'fence',
  ],
  images: {
    ovumcy: {
      source: { dockerBuild: {} },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
