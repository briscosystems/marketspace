/**
 * Testphase: die Willkommensseite vor dem Marktplatz.
 *
 * Betreiber 2026-08-13: Testkunden sollen zuerst erfahren, worauf sie sich
 * einlassen — dass dies ein **Prototyp** ist, dass noch zu wenige echte Daten
 * im System stehen und dass die Plattform mit jedem Feedback besser wird. Erst
 * nach „Eintreten" geht es weiter; damit bestätigt der Testkunde zugleich, den
 * Zugang während der Testphase nicht weiterzugeben.
 *
 * Seit 2026-08-15 ist diese Seite mit ihrem Passwort der EINZIGE
 * Zugangsschritt — die frühere weiße Passwortsperre (lib/gate.ts) ist
 * entfernt: „eine genügt" (Betreiber).
 *
 * Es wird nichts serverseitig gespeichert: Ein Cookie mit dem Datum der
 * Bestätigung genügt. Ein signiertes Token wäre Sicherheitstheater — die Seite
 * schützt nichts, sie informiert.
 */
export const TESTPHASE_COOKIE = "mp_testkunde";

/** Ein halbes Jahr — lange genug, dass niemand die Seite zweimal die Woche sieht. */
export const TESTPHASE_COOKIE_MAXAGE = 60 * 60 * 24 * 180;

/**
 * Läuft die Testphase? Standard: ja. Abschaltbar mit TESTPHASE=false, sobald
 * der Betrieb öffentlich ist.
 */
export function testphaseAktiv(): boolean {
  return process.env.TESTPHASE !== "false";
}

/**
 * Das Testphasen-Passwort (Betreiber 2026-08-15): fix vergeben und an die
 * Testkunden kommuniziert. Per Umgebungsvariable TESTPHASE_PASSWORT
 * änderbar, ohne den Code anzufassen — z. B. wenn der Link doch die Runde
 * macht und das Passwort gewechselt werden muss.
 */
export function testphasePasswort(): string {
  return process.env.TESTPHASE_PASSWORT || "BriscoMarketspace2026";
}

/** Hat der Besucher „Eintreten" schon gedrückt? */
export function testphaseBestaetigt(cookieWert: string | undefined): boolean {
  return typeof cookieWert === "string" && cookieWert.length > 0;
}
