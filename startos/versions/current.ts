import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  // The image is a post-1.9.2 commit build (see Dockerfile); the base stays
  // 1.9.2 until upstream tags a release containing it.
  version: '1.9.2:0',
  releaseNotes: {
    en_US: 'Initial release for StartOS',
    es_ES: 'Lanzamiento inicial para StartOS',
    de_DE: 'Erstveröffentlichung für StartOS',
    pl_PL: 'Pierwsze wydanie dla StartOS',
    fr_FR: 'Version initiale pour StartOS',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
