import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { getT } from "@/lib/i18n-server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingEditForm } from "@/components/ListingEditForm";
import { ListingPhotoUpload } from "@/components/ListingPhotoUpload";

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ neu?: string }>;
}) {
  const t = await getT();
  const { id } = await params;
  const { neu } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/listings/${id}/edit`);
  }
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { photos: { select: { id: true, position: true }, orderBy: { position: "asc" } } },
  });
  if (!listing) notFound();
  if (listing.sellerId !== session.user.id) {
    redirect(`/listings/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={`/listings/${listing.id}`} className="text-sm text-brand-700 hover:underline">
        ← zurück zum Angebot
      </Link>
      {neu === "1" && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <PackageCheck size={18} className="mt-0.5 shrink-0" />
          <span>
            <strong>Dein Angebot ist online.</strong> Käufer finden es ab sofort über die Suche.
            Ergänze jetzt noch Fotos — Angebote mit eigenen Bildern werden deutlich häufiger
            angefragt.{" "}
            <Link href={`/listings/${listing.id}`} className="font-semibold underline">
              Öffentliche Ansicht öffnen
            </Link>
          </span>
        </div>
      )}
      <h1 className="page-title">{t("le.title")}</h1>
      <ListingEditForm
        listing={{
          id: listing.id,
          productType: listing.productType,
          manufacturer: listing.manufacturer,
          productName: listing.productName,
          isoViscosity: listing.isoViscosity,
          chemistry: listing.chemistry,
          applicationArea: listing.applicationArea,
          quantity: listing.quantity,
          quantityUnit: listing.quantityUnit,
          minOrderQty: listing.minOrderQty,
          locationRegion: listing.locationRegion,
          packaging: listing.packaging,
          certificates: listing.certificates,
          priceEur: listing.priceEur,
          shippingTerms: listing.shippingTerms,
          description: listing.description,
          status: listing.status,
        }}
      />

      {/* Fotos werden getrennt vom Formular gespeichert: sie gehen sofort raus,
          damit auf dem Handy nichts verloren geht, wenn das Formular noch offen ist. */}
      <div className="card">
        <ListingPhotoUpload listingId={listing.id} initial={listing.photos} />
      </div>
    </div>
  );
}
