import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  // The image is a post-1.9.2 commit build (see Dockerfile); the base stays
  // 1.9.2 until upstream tags a release containing it.
  version: '1.9.2:1',
  releaseNotes: {
    en_US:
      'Security update. A settings or Today page left open can no longer write to, or read the status of, an account that signed in after it in the same browser. A refused form no longer spends the one-time value on a two-factor setup or recovery-code page. Outbound reminder webhooks get Go 1.27.3 (CVE-2026-111943) and a certificate store that no longer trusts the withdrawn eMudhra authority.',
    es_ES:
      'Actualización de seguridad. Una página de ajustes o de Hoy que quede abierta ya no puede escribir en una cuenta que haya iniciado sesión después en el mismo navegador, ni leer su estado. Un formulario rechazado ya no gasta el valor de un solo uso de la página de doble factor o de código de recuperación. Los webhooks de recordatorio salientes incorporan Go 1.27.3 (CVE-2026-111943) y un almacén de certificados que ya no confía en la autoridad eMudhra retirada.',
    de_DE:
      'Sicherheitsupdate. Eine offen gelassene Einstellungs- oder Heute-Seite kann nicht mehr in ein Konto schreiben, das sich danach im selben Browser angemeldet hat, und dessen Status nicht mehr lesen. Ein abgewiesenes Formular verbraucht den Einmalwert der Seite für Zwei-Faktor-Einrichtung oder Wiederherstellungscode nicht mehr. Ausgehende Erinnerungs-Webhooks erhalten Go 1.27.3 (CVE-2026-111943) und einen Zertifikatsspeicher, der der zurückgezogenen Zertifizierungsstelle eMudhra nicht mehr vertraut.',
    pl_PL:
      'Aktualizacja bezpieczeństwa. Pozostawiona otwarta strona ustawień lub Dzisiaj nie może już zapisywać na koncie, które zalogowało się po niej w tej samej przeglądarce, ani czytać jego stanu. Odrzucony formularz nie zużywa już jednorazowej wartości ze strony konfiguracji dwuetapowej ani kodu odzyskiwania. Wychodzące webhooki przypomnień otrzymują Go 1.27.3 (CVE-2026-111943) oraz magazyn certyfikatów, który nie ufa już wycofanemu urzędowi eMudhra.',
    fr_FR:
      'Mise à jour de sécurité. Une page de réglages ou Aujourd’hui laissée ouverte ne peut plus écrire dans un compte connecté après elle dans le même navigateur, ni lire son état. Un formulaire refusé ne consomme plus la valeur à usage unique de la page de double authentification ou de code de récupération. Les webhooks de rappel sortants bénéficient de Go 1.27.3 (CVE-2026-111943) et d’un magasin de certificats qui ne fait plus confiance à l’autorité eMudhra retirée.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
