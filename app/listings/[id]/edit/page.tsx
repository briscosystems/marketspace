import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingEditForm } from "@/components/ListingEditForm";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/listings/${id}/edit`);
  }
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) notFound();
  if (listing.sellerId !== session.user.id) {
    redirect(`/listings/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Listing bearbeiten</h1>
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
    </div>
  );
}
