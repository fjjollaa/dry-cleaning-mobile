import "server-only";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

// Google është hyrja për klientët e vërtetë. GitHub aktivizohet vetëm nëse ekzistojnë GH_CLIENT_ID
// dhe GH_CLIENT_SECRET (për prova gjatë zhvillimit); në publikim mos i vendos.
const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const github = Boolean(process.env.GH_CLIENT_ID && process.env.GH_CLIENT_SECRET);

export const providerat: string[] = [...(google ? ["google"] : []), ...(github ? ["github"] : [])];

// Ofruesi verifikon identitetin. Rolin (klient / pronar) e lexojmë veçmas nga Neon.
// ID e llogarisë = "ofruesi:numri" (p.sh. google:1234), që dy ofrues të mos përplasen.
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    ...(google
      ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! })]
      : []),
    ...(github
      ? [GitHubProvider({ clientId: process.env.GH_CLIENT_ID!, clientSecret: process.env.GH_CLIENT_SECRET! })]
      : []),
  ],
  session: { strategy: "jwt", maxAge: 2 * 60 * 60 },
  callbacks: {
    async jwt({ token, account }) {
      if (account) token.uid = `${account.provider}:${account.providerAccountId}`;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = typeof token.uid === "string" ? token.uid : "";
      return session;
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
  }
}
