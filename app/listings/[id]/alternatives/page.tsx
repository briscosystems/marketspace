import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AlternativesClient } from "./AlternativesClient";

export default async function AlternativesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await prisma.listing.findUnique({
    where: { id },
    include: { seller: { select: { pseudonym: true, trustTier: true } } },
  });
  if (!source) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/listings/${id}`}
        className="text-sm text-brand-500 hover:underline"
      >
        ← zurück zum Listing
      </Link>
      <AlternativesClient
        sourceId={source.id}
        sourceManufacturer={source.manufacturer}
        sourceProductName={source.productName}
        sourceProductType={source.productType}
        sourceChemistry={source.chemistry}
        sourceIsoViscosity={source.isoViscosity}
        sourceApplicationArea={source.applicationArea}
        sourcePackaging={source.packaging}
        sourceCertificates={source.certificates}
      />
    </div>
  );
}
