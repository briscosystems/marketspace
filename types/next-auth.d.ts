import "next-auth";

type TrustTier = "UNVERIFIED" | "VERIFIED" | "TRADE_ASSURED" | "PREMIUM";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: "RESELLER" | "OEM" | "ADMIN";
      trustTier: TrustTier;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "RESELLER" | "OEM" | "ADMIN";
    trustTier: TrustTier;
  }
}
