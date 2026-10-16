import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  // The upstream version this build descends from, plus this package's
  // revision. The image is pinned to a post-1.9.2 main-branch commit (see
  // startos/manifest/index.ts), so the base stays 1.9.2 until upstream tags a
  // release that contains it.
  version: '1.9.2:1',
  releaseNotes: {
    en_US:
      'Run the service as root inside its own container: StartOS refuses the mount id-remap this package first used, and the upstream image has no chown. Pin a post-1.9.2 upstream build so account recovery works without a terminal.',
    es_ES:
      'Ejecuta el servicio como root dentro de su propio contenedor: StartOS rechaza la reasignación de identificadores de montaje que este paquete usaba antes, y la imagen oficial no incluye chown. Fija una compilación posterior a la 1.9.2 para que la recuperación de cuentas funcione sin terminal.',
    de_DE:
      'Der Dienst läuft als root in seinem eigenen Container: StartOS verweigert die zuvor verwendete ID-Umsetzung am Mount, und das Upstream-Image enthält kein chown. Außerdem ist ein Upstream-Build nach 1.9.2 gepinnt, damit die Kontowiederherstellung ohne Terminal funktioniert.',
    pl_PL:
      'Usługa działa jako root we własnym kontenerze: StartOS odrzuca stosowane wcześniej przemapowanie identyfikatorów montowania, a obraz upstream nie zawiera chown. Przypięto też kompilację upstream nowszą niż 1.9.2, aby odzyskiwanie konta działało bez terminala.',
    fr_FR:
      'Le service tourne en root dans son propre conteneur : StartOS refuse le remappage d’identifiants au montage utilisé auparavant, et l’image amont ne contient pas chown. Une version amont postérieure à 1.9.2 est également épinglée pour que la récupération de compte fonctionne sans terminal.',
  },
  migrations: {
    up: async ({ effects }) => {},
    // Upstream documents downgrade caveats: a database that has been through a
    // newer release's migrations is not guaranteed readable by an older one.
    down: IMPOSSIBLE,
  },
})
