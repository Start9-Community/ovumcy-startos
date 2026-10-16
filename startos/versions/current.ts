import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.9.2:0',
  releaseNotes: {
    en_US: 'Initial release of Ovumcy for StartOS',
    es_ES: 'Primera versión de Ovumcy para StartOS',
    de_DE: 'Erste Veröffentlichung von Ovumcy für StartOS',
    pl_PL: 'Pierwsze wydanie Ovumcy dla StartOS',
    fr_FR: 'Première version d’Ovumcy pour StartOS',
  },
  migrations: {
    up: async ({ effects }) => {},
    // Upstream documents downgrade caveats: a database that has been through a
    // newer release's migrations is not guaranteed readable by an older one.
    down: IMPOSSIBLE,
  },
})
