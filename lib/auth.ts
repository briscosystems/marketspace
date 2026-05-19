import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.pseudonym,
          role: user.role,
          trustTier: user.trustTier,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          role: "RESELLER" | "OEM" | "ADMIN";
          trustTier: "UNVERIFIED" | "VERIFIED" | "TRADE_ASSURED" | "PREMIUM";
        };
        token.id = u.id;
        token.role = u.role;
        token.trustTier = u.trustTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as {
          id?: string;
          role?: string;
          trustTier?: string;
        };
        u.id = token.id as string;
        u.role = token.role as string;
        u.trustTier = token.trustTier as string;
      }
      return session;
    },
  },
};
