"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildSearchTokens } from "@/lib/normalize-search";
import { revalidatePath } from "next/cache";
import { grantCredits, setSetting, createReferralCode, type SettingKey } from "@/lib/credits";
import { sendEmail } from "@/lib/mailer";

/**
 * Stellt sicher, dass NUR der Eigentümer (Rolle ADMIN) diese Aktionen ausführt.
 * Wirft sonst — die Seite selbst liefert für alle anderen ohnehin 404.
 */
async function assertOwner() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Nicht berechtigt.");
  }
}

/**
 * Setzt den versteckten Sichtbarkeits-Boost eines Resellers.
 * Höherer Wert ⇒ dessen Angebote erscheinen weiter oben in Suche & Vorschlägen.
 * Wert wird auf 0–100 begrenzt. Für normale Nutzer ist das komplett unsichtbar.
 */
export async function updateSearchBoost(formData: FormData) {
  await assertOwner();

  const userId = String(formData.get("userId") ?? "");
  const raw = Number(formData.get("boost") ?? 0);
  if (!userId) return;

  const boost = Math.max(0, Math.min(100, Math.round(Number.isFinite(raw) ? raw : 0)));
  await prisma.user.update({ where: { id: userId }, data: { searchBoost: boost } });

  // Seiten neu rendern, deren Reihenfolge vom Boost abhängt.
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/listings");
}

/**
 * Monetarisierungs-Einstellungen speichern: Startguthaben, Trial-Dauer,
 * Referral-Prämie, Credit-Preis. Werte landen in AppSetting.
 */
export async function updateMonetizationSettings(formData: FormData) {
  await assertOwner();

  const fields: { name: SettingKey; min: number; max: number }[] = [
    { name: "welcomeCredits", min: 0, max: 1000 },
    { name: "trialDays", min: 0, max: 365 },
    { name: "referralCredits", min: 0, max: 500 },
    { name: "creditPriceCt", min: 1, max: 1000 },
    { name: "membershipPriceEur", min: 1, max: 100000 },
    { name: "membershipPriceProEur", min: 1, max: 100000 },
    { name: "membershipPriceMarkeEur", min: 1, max: 100000 },
    { name: "protectionFeeBp", min: 0, max: 2000 },
    { name: "protectionFeeFixedCt", min: 0, max: 10000 },
    { name: "basisListingLimit", min: 1, max: 100000 },
  ];
  for (const f of fields) {
    const raw = Number(formData.get(f.name));
    if (!Number.isFinite(raw)) continue;
    const value = Math.max(f.min, Math.min(f.max, Math.round(raw)));
    await setSetting(f.name, value);
  }
  revalidatePath("/admin");
  revalidatePath("/mitgliedschaft");
}

/**
 * Credits eines Nutzers manuell anpassen (positiv = gutschreiben,
 * negativ = abziehen). Mit Historieneintrag ADMIN_ADJUST.
 */
export async function adjustCredits(formData: FormData) {
  await assertOwner();

  const userId = String(formData.get("userId") ?? "");
  const raw = Number(formData.get("amount") ?? 0);
  if (!userId || !Number.isFinite(raw) || raw === 0) return;

  const amount = Math.max(-100000, Math.min(100000, Math.round(raw)));
  await grantCredits(userId, amount, "ADMIN_ADJUST", "Manuelle Anpassung durch Eigentümer");

  revalidatePath("/admin");
}

/**
 * Kennenlernphase eines Nutzers verlängern/setzen (Tage ab heute).
 */
export async function setTrialDays(formData: FormData) {
  await assertOwner();

  const userId = String(formData.get("userId") ?? "");
  const raw = Number(formData.get("days") ?? 0);
  if (!userId || !Number.isFinite(raw)) return;

  const days = Math.max(0, Math.min(365, Math.round(raw)));
  const trialEndsAt = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;
  await prisma.user.update({ where: { id: userId }, data: { trialEndsAt } });

  revalidatePath("/admin");
}

/**
 * „Gratis-Konto": setzt die Mitgliedschaft eines Nutzers auf X Jahre ab heute
 * (0 = Gratis-Mitgliedschaft entfernen). Gedacht für Gründungs-Händler und
 * Partner, die nichts zahlen sollen — der Nutzer hat damit vollen Zugang,
 * ohne Abo und ohne Trial-Ablauf.
 */
export async function setFreeMembership(formData: FormData) {
  await assertOwner();

  const userId = String(formData.get("userId") ?? "");
  const raw = Number(formData.get("months") ?? 0);
  if (!userId || !Number.isFinite(raw)) return;

  const months = Math.max(0, Math.min(120, Math.round(raw)));
  let membershipValidUntil: Date | null = null;
  if (months > 0) {
    membershipValidUntil = new Date();
    membershipValidUntil.setMonth(membershipValidUntil.getMonth() + months);
  }
  await prisma.user.update({ where: { id: userId }, data: { membershipValidUntil } });

  revalidatePath("/admin");
}

/**
 * Referral-/Gutschein-Code generieren. Nur der Eigentümer sieht diesen
 * Bereich in /admin. Ein leeres "code"-Feld erzeugt einen Zufalls-Code.
 */
export async function createReferralCodeAction(formData: FormData) {
  await assertOwner();
  const session = await getServerSession(authOptions);
  const adminId = session!.user.id;

  const codeRaw = String(formData.get("code") ?? "").trim();
  const credits = Math.max(1, Math.min(10000, Math.round(Number(formData.get("credits") ?? 0))));
  const trialDays = Math.max(0, Math.min(730, Math.round(Number(formData.get("trialDays") ?? 0))));
  const maxUses = Math.max(1, Math.min(100000, Math.round(Number(formData.get("maxUses") ?? 1))));
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || undefined;
  if (!Number.isFinite(credits) || credits <= 0) return;

  await createReferralCode({
    createdById: adminId,
    credits,
    trialDays,
    maxUses,
    expiresAt: expiresRaw ? new Date(expiresRaw) : null,
    note,
    code: codeRaw || undefined,
  });

  revalidatePath("/admin");
}

/** Code deaktivieren — kann danach nicht mehr eingelöst werden. */
export async function deactivateReferralCode(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.referralCode.update({ where: { id }, data: { active: false } });
  revalidatePath("/admin");
}

/**
 * Löscht einen Referral-Code — aber NUR, wenn er nie eingelöst wurde. Ein bereits
 * genutzter Code bleibt als Beleg erhalten (wer hat wann Credits erhalten); dafür
 * gibt es „Deaktivieren". So geht keine Nachvollziehbarkeit verloren.
 */
export async function deleteReferralCode(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const code = await prisma.referralCode.findUnique({
    where: { id },
    select: { usedCount: true },
  });
  if (!code || code.usedCount > 0) return; // benutzte Codes nicht löschen
  await prisma.referralCode.delete({ where: { id } });
  revalidatePath("/admin");
}

// ---------- Käuferschutz: Problemfall-Entscheidung ----------

/** Problemfall: geparktes Geld trotz Reklamation an den Verkäufer freigeben. */
export async function resolveProtectionRelease(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { releaseProtection } = await import("@/lib/protection-flow");
  const result = await releaseProtection(id);
  if (result.ok) {
    await prisma.transaction.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }
  revalidatePath("/admin");
}

/** Problemfall: geparktes Geld an den Käufer zurückerstatten (inkl. Gebühr). */
export async function resolveProtectionRefund(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { refundProtection } = await import("@/lib/protection-flow");
  const result = await refundProtection(id);
  if (result.ok) {
    await prisma.transaction.update({
      where: { id },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
  }
  revalidatePath("/admin");
}

/**
 * Verschickt eine Test-E-Mail an das eigene Admin-Postfach — zum Prüfen, ob der
 * Live-Versand (ZeptoMail) wirklich zustellt. Ergebnis erscheint als Log-Eintrag
 * unter „System-E-Mails".
 */
export async function sendTestEmail(formData?: FormData) {
  await assertOwner();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return;
  // Adresse zuverlässig aus der DB holen (die Session führt sie evtl. nicht).
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  // Zieladresse frei wählbar (Betreiber 2026-08-18): Ein Nutzer bekam keine
  // Passwort-Mail; um solche Fälle zu prüfen, muss man gezielt an die betroffene
  // Adresse senden können, nicht nur an das eigene Postfach.
  const gewuenscht = String(formData?.get("to") ?? "").trim();
  const to = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(gewuenscht) ? gewuenscht : me?.email;
  if (!to) return;
  await sendEmail({
    userId,
    kind: "PASSWORD_RESET", // vorhandener Typ; reiner Testzweck
    to,
    subject: "Brisco — Test-E-Mail",
    body:
      "Das ist eine Test-E-Mail aus dem Admin-Bereich.\n\n" +
      "Wenn du sie erhältst, funktioniert der E-Mail-Versand live.\n\n" +
      "Brisco Systems GmbH",
  });
  revalidatePath("/admin");
}

/**
 * Konto manuell sperren oder entsperren. Gesperrte Konten können sich nicht
 * mehr anmelden, laufende Sitzungen verlieren beim nächsten Aufruf den Zugriff
 * (JWT-Prüfung in lib/auth.ts), API-Schlüssel werden abgewiesen.
 */
export async function toggleUserBlock(formData: FormData) {
  await assertOwner();
  const userId = String(formData.get("userId") ?? "");
  const grund = String(formData.get("grund") ?? "").trim() || null;
  if (!userId) return;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { blockedAt: true, role: true },
  });
  if (!user) return;
  // Der Betreiber kann sich nicht selbst aussperren.
  if (user.role === "ADMIN") return;
  await prisma.user.update({
    where: { id: userId },
    data: user.blockedAt
      ? { blockedAt: null, blockedReason: null }
      : { blockedAt: new Date(), blockedReason: grund },
  });
  revalidatePath("/admin");
}


/** Erfahrungsbericht freigeben: veröffentlicht ihn und schreibt die Prämie gut. */
export async function approveExperience(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const bericht = await prisma.experienceReport.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });
  if (!bericht || bericht.status !== "PENDING") return;
  const PRAEMIE = 2;
  await prisma.$transaction([
    prisma.experienceReport.update({
      where: { id },
      data: { status: "APPROVED", creditsAwarded: PRAEMIE, reviewedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: bericht.userId },
      data: { creditBalance: { increment: PRAEMIE } },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: bericht.userId,
        amount: PRAEMIE,
        kind: "EXPERIENCE",
        note: "Prämie: Praxis-Erfahrung freigegeben",
      },
    }),
  ]);
  revalidatePath("/admin");
}

/** Erfahrungsbericht ablehnen (z. B. Werbung, Beleidigung, kein Inhalt). */
export async function rejectExperience(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  const grund = String(formData.get("grund") ?? "").trim() || null;
  if (!id) return;
  await prisma.experienceReport.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "REJECTED", adminNote: grund, reviewedAt: new Date() },
  });
  revalidatePath("/admin");
}

/**
 * Erfahrungsbericht korrigieren (Betreiber-Recht, 2026-08-10).
 *
 * Der Betreiber darf jeden Bericht ändern — Tippfehler, unklare Formulierung,
 * versehentlich mitgeschriebener Firmenname. Die Korrektur wird im Bericht
 * vermerkt, damit später nachvollziehbar bleibt, dass eingegriffen wurde.
 */
export async function editExperience(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!id || text.length < 10) return;

  await prisma.experienceReport.update({
    where: { id },
    data: {
      text,
      adminNote: `Vom Betreiber bearbeitet am ${new Date().toISOString().slice(0, 10)}`,
    },
  });
  revalidatePath("/admin");
}

/**
 * Erfahrungsbericht endgültig löschen (Betreiber-Recht).
 *
 * Bewusst harte Löschung statt „versteckt": Wer einen Bericht zurückzieht oder
 * wessen Bericht rechtlich nicht haltbar ist, soll ihn nicht als Datenleiche
 * hinterlassen. Angehängte Medien gehen über die Datenbank-Beziehung mit.
 */
export async function deleteExperience(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.experienceReport.delete({ where: { id } });
  revalidatePath("/admin");
}

/**
 * Einzelnes Foto (oder Video/Laborbericht) aus einem Erfahrungsbericht
 * entfernen — Betreiber-Recht (2026-08-10).
 *
 * Warum einzeln: Ein Bericht kann fachlich wertvoll sein und trotzdem ein Foto
 * enthalten, das nicht bleiben darf — ein erkennbares Firmenschild im
 * Hintergrund, ein Laborbericht mit Namen. Dann soll der Betreiber das Bild
 * entfernen können, ohne den ganzen Bericht zu verlieren.
 */
export async function deleteExperienceMedia(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("mediaId") ?? "");
  if (!id) return;
  await prisma.experienceMedia.delete({ where: { id } });
  revalidatePath("/admin");
}

/**
 * Einzelnes Angebotsfoto entfernen — Betreiber-Recht.
 *
 * Anbieter laden eigene Fotos hoch; gelegentlich landet dort etwas, das nicht
 * bleiben kann (fremde Katalogbilder, versehentlich mitfotografierte Papiere).
 * Der Anbieter selbst kann seine Fotos ohnehin löschen — das hier ist das
 * Eingriffsrecht des Betreibers.
 */
export async function deleteListingPhoto(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("photoId") ?? "");
  if (!id) return;
  await prisma.listingPhoto.delete({ where: { id } });
  revalidatePath("/admin");
}

/**
 * Gemeldetes Produkt freigeben — legt es im Katalog an (2026-08-11).
 *
 * Die hochgeladenen Unterlagen bleiben an der Meldung hängen; das Katalog-
 * produkt bekommt den Vermerk, dass die Daten von einem Anbieter stammen und
 * geprüft wurden. Quellenangabe bleibt damit ehrlich.
 */
export async function approveProductSubmission(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const m = await prisma.productSubmission.findUnique({ where: { id } });
  if (!m || m.status !== "PENDING") return;

  // Hersteller anlegen, falls unbekannt — rein additiv.
  const slugify = (x: string) =>
    x.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  let hersteller = await prisma.manufacturer.findFirst({
    where: { name: { equals: m.manufacturer, mode: "insensitive" } },
    select: { id: true },
  });
  if (!hersteller) {
    // Der Slug muss eindeutig sein — bei Zusammenstoß hängen wir eine Zahl an,
    // statt die Freigabe mit einem Fehler abbrechen zu lassen.
    const basis = slugify(m.manufacturer) || "hersteller";
    let slugH = basis;
    for (let i = 2; await prisma.manufacturer.findUnique({ where: { slug: slugH }, select: { id: true } }); i++) {
      slugH = `${basis}-${i}`;
    }
    hersteller = await prisma.manufacturer.create({
      data: { name: m.manufacturer, slug: slugH },
      select: { id: true },
    });
  }

  const slug = slugify(m.name);
  const schonDa = await prisma.product.findFirst({
    where: { manufacturerId: hersteller.id, slug },
    select: { id: true },
  });

  const produkt =
    schonDa ??
    (await prisma.product.create({
      data: {
        manufacturerId: hersteller.id,
        name: m.name,
        slug,
        category: "OTHER",
        description: m.notes ?? `${m.productType} — von einem Anbieter gemeldet und geprüft.`,
        viscosityIso: m.isoViscosity ?? undefined,
        sourceConfidence: "anbieter-meldung",
        notes: `Gemeldet über das Angebots-Formular am ${m.createdAt.toISOString().slice(0, 10)}; Datenblatt und Sicherheitsdatenblatt liegen der Meldung bei. Freigegeben ${new Date().toISOString().slice(0, 10)}.`,
        searchTokens: buildSearchTokens({ productName: m.name, manufacturer: m.manufacturer }),
      },
      select: { id: true },
    }));

  await prisma.productSubmission.update({
    where: { id },
    data: { status: "APPROVED", reviewedAt: new Date(), productId: produkt.id },
  });
  revalidatePath("/admin");
}

/** Gemeldetes Produkt ablehnen — mit internem Grund. */
export async function rejectProductSubmission(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  const grund = String(formData.get("grund") ?? "").trim();
  if (!id) return;
  await prisma.productSubmission.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "REJECTED", adminNote: grund || null, reviewedAt: new Date() },
  });
  revalidatePath("/admin");
}

/**
 * Problemfall beantworten (2026-08-12): Die KI grenzt ein, aber die letzte
 * Auskunft gibt der Betreiber — vor allem in den Fällen, die die KI bewusst
 * offen gelassen hat.
 */
export async function answerProblemCase(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  const antwort = String(formData.get("antwort") ?? "").trim();
  if (!id || !antwort) return;
  await prisma.problemCase.update({
    where: { id },
    data: { adminNote: antwort, status: "BEANTWORTET", answeredAt: new Date() },
  });
  revalidatePath("/admin");
}

/** Problemfall schließen — erledigt, ohne dass noch etwas zu schreiben wäre. */
export async function closeProblemCase(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.problemCase.update({ where: { id }, data: { status: "GESCHLOSSEN" } });
  revalidatePath("/admin");
}

/** Problemfall löschen — mit allen Belegen. */
export async function deleteProblemCase(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.problemCase.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin");
}

/**
 * Angebot löschen (2026-08-14): Der Betreiber muss Inhalte entfernen können —
 * z. B. Fake-Angebote aus der Aufbauphase. Gespräche und Transaktionen
 * bleiben erhalten (ihr Verweis auf das Angebot wird geleert), Fotos gehen mit.
 */
export async function adminDeleteListing(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.listing.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin");
  revalidatePath("/listings");
  revalidatePath("/");
}

/** Suche (Anfrage) löschen — Angebote darauf gehen mit, Transaktionen bleiben. */
export async function adminDeleteRfq(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.rfq.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin");
  revalidatePath("/rfqs");
}

/**
 * Anmelde-Aktion anlegen (2026-08-16): Zeitraum, optionaler Code, Gutschrift
 * in Euro (wird als Credits gespeichert, 1 Credit = 0,10 €).
 */
export async function createCreditAktion(formData: FormData) {
  await assertOwner();
  const titel = String(formData.get("titel") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const eurAnmeldung = parseFloat(String(formData.get("eurAnmeldung") ?? "0").replace(",", "."));
  const eurEmpfehlung = parseFloat(String(formData.get("eurEmpfehlung") ?? "0").replace(",", "."));
  const von = String(formData.get("von") ?? "");
  const bis = String(formData.get("bis") ?? "");
  if (!titel || !von || !bis || !Number.isFinite(eurAnmeldung) || eurAnmeldung <= 0) return;
  const startsAt = new Date(`${von}T00:00:00`);
  const endsAt = new Date(`${bis}T23:59:59`);
  if (!(startsAt < endsAt)) return;
  await prisma.creditAktion.create({
    data: {
      titel,
      code,
      creditsAnmeldung: Math.round(eurAnmeldung * 10),
      creditsEmpfehlung: Number.isFinite(eurEmpfehlung) ? Math.max(0, Math.round(eurEmpfehlung * 10)) : 0,
      startsAt,
      endsAt,
    },
  });
  revalidatePath("/admin");
}

/** Aktion beenden/reaktivieren — beendet wirkt sofort, gebuchte Gutschriften bleiben. */
export async function toggleCreditAktion(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const a = await prisma.creditAktion.findUnique({ where: { id }, select: { active: true } });
  if (!a) return;
  await prisma.creditAktion.update({ where: { id }, data: { active: !a.active } });
  revalidatePath("/admin");
}

/**
 * Notfall-Eingriff in Chats (Betreiber 2026-08-16): Der Admin kann einzelne
 * Nachrichten löschen — z. B. bei Beleidigungen, Kontaktdaten-Tausch oder
 * versehentlich geteilten Geheimnissen. Der Text wird durch einen sichtbaren
 * Vermerk ersetzt statt spurlos zu verschwinden: Beide Gesprächspartner sehen,
 * DASS eingegriffen wurde.
 */
export async function redactMessage(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.message.updateMany({
    where: { id },
    data: { body: "[Nachricht vom Betreiber entfernt]" },
  });
  revalidatePath("/admin");
}

/** Nachricht endgültig löschen — für Fälle, in denen auch der Vermerk stört. */
export async function deleteMessage(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.message.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin");
}

/**
 * Konto endgültig löschen (Betreiber 2026-08-18).
 *
 * Mit allem, was daran hängt: Angebote, Anfragen, Gespräche, Messungen,
 * Erfahrungsberichte (Datenbank-Beziehungen räumen kaskadierend auf).
 *
 * Zwei Sicherungen, die bewusst NICHT verhandelbar sind:
 *  1. Ein Admin-Konto lässt sich nicht löschen — sonst sperrt man sich selbst aus.
 *  2. Wer abgeschlossene Transaktionen hat, wird nur gesperrt statt gelöscht:
 *     Geschäftsvorfälle müssen nachvollziehbar bleiben (Buchhaltung, Streitfall).
 *     Das Konto verschwindet aus der Nutzung, die Belege bleiben.
 */
export async function deleteUserAccount(formData: FormData) {
  await assertOwner();
  const id = String(formData.get("userId") ?? "");
  if (!id) return;

  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      pseudonym: true,
      _count: { select: { buyerTxns: true, sellerTxns: true } },
    },
  });
  if (!u || u.role === "ADMIN") return;

  if (u._count.buyerTxns + u._count.sellerTxns > 0) {
    // Nicht löschen, sondern stilllegen — die Geschäftsvorfälle bleiben lesbar.
    await prisma.user.update({
      where: { id },
      data: {
        blockedAt: new Date(),
        blockedReason: "Konto auf Wunsch entfernt — wegen bestehender Transaktionen nur gesperrt.",
      },
    });
    revalidatePath("/admin");
    return;
  }

  await prisma.user.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin");
}
