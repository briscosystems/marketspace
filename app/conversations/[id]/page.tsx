import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/MessageThread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const me = session.user.id;
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, pseudonym: true } },
      seller: { select: { id: true, pseudonym: true } },
      listing: {
        select: { id: true, manufacturer: true, productName: true, productType: true },
      },
    },
  });
  if (!conversation) notFound();
  if (conversation.buyerId !== me && conversation.sellerId !== me) {
    redirect("/conversations");
  }

  const counterpart =
    conversation.buyerId === me ? conversation.seller : conversation.buyer;

  return (
    <div className="space-y-4">
      <Link href="/conversations" className="text-sm text-brand-500 hover:underline">
        ← Nachrichten-Übersicht
      </Link>
      <div className="card">
        <div className="mb-1 flex items-center gap-2">
          <h1 className="page-title">{counterpart.pseudonym}</h1>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {conversation.buyerId === me ? "Verkäufer" : "Käufer"}
          </span>
        </div>
        {conversation.listing && (
          <div className="mb-3 text-sm text-slate-600">
            zu Listing:{" "}
            <Link
              href={`/listings/${conversation.listing.id}`}
              className="text-brand-500 hover:underline"
            >
              {conversation.listing.manufacturer} {conversation.listing.productName}
            </Link>{" "}
            ({conversation.listing.productType})
          </div>
        )}
        <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
          Diese Konversation läuft pseudonym über die Plattform. Klarname,
          Telefonnummer und Email der Gegenseite bleiben verborgen. Der
          AI-Kontaktdaten-Filter (FDS 4.5) ist in dieser Iteration noch nicht aktiv.
        </div>
      </div>

      <MessageThread conversationId={conversation.id} meId={me} />
    </div>
  );
}
