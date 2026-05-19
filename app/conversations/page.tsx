import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ConversationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/conversations");
  const me = session.user.id;

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: me }, { sellerId: me }] },
    include: {
      buyer: { select: { id: true, pseudonym: true } },
      seller: { select: { id: true, pseudonym: true } },
      listing: { select: { id: true, manufacturer: true, productName: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nachrichten</h1>
      {conversations.length === 0 ? (
        <div className="card text-slate-500">
          Noch keine Konversationen. Öffne ein Listing und klicke auf{" "}
          <em>„Verkäufer kontaktieren"</em>.
        </div>
      ) : (
        <div className="card divide-y divide-slate-200">
          {conversations.map((c) => {
            const counterpart = c.buyerId === me ? c.seller : c.buyer;
            const role = c.buyerId === me ? "Käufer" : "Verkäufer";
            const last = c.messages[0];
            return (
              <Link
                key={c.id}
                href={`/conversations/${c.id}`}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 hover:text-brand-500"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{counterpart.pseudonym}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {role}
                    </span>
                  </div>
                  {c.listing && (
                    <div className="text-xs text-slate-500">
                      zu „{c.listing.manufacturer} {c.listing.productName}"
                    </div>
                  )}
                  <div className="mt-1 truncate text-sm text-slate-600">
                    {last
                      ? `${last.senderId === me ? "Du: " : ""}${last.body}`
                      : "Noch keine Nachrichten"}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-slate-400">
                  {(last?.createdAt ?? c.createdAt).toLocaleDateString("de-DE")}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
