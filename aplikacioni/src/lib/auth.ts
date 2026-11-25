import "server-only";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { getSql } from "./db";
import { verifikoHyrjen } from "./llogari-core";

// Tri mënyra hyrjeje:
//  - email + fjalëkalim (për çdokënd; llogaria krijohet te /regjistrohu);
//  - Google (nëse janë vendosur GOOGLE_CLIENT_ID dhe GOOGLE_CLIENT_SECRET);
//  - GitHub vetëm për prova gjatë zhvillimit (nëse ekzistojnë GH_CLIENT_ID dhe GH_CLIENT_SECRET; mos i vendos në publikim).
const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const github = Boolean(process.env.GH_CLIENT_ID && process.env.GH_CLIENT_SECRET);

// Ofruesit OAuth që shfaqen si butona (email + fjalëkalimi ka formën e vet).
export const providerat: string[] = [...(google ? ["google"] : []), ...(github ? ["github"] : [])];

// Ofruesi verifikon identitetin. Rolin (klient / pronar) e lexojmë veçmas nga Neon.
// ID e llogarisë = "ofruesi:numri" (google:1234, github:1234) ose "email:uuid" për llogaritë me fjalëkalim.
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: { email: { type: "email" }, fjalekalimi: { type: "password" } },
      async authorize(credentials) {
        const r = await verifikoHyrjen(getSql(), credentials?.email, credentials?.fjalekalimi);
        if (!r.ok) {
          if (r.arsyeja === "bllokuar") throw new Error("BLLOKUAR");
          return null;
        }
        return { id: r.id, name: r.emri };
      },
    }),
    ...(google
      ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! })]
      : []),
    ...(github
      ? [GitHubProvider({ clientId: process.env.GH_CLIENT_ID!, clientSecret: process.env.GH_CLIENT_SECRET! })]
      : []),
  ],
  session: { strategy: "jwt", maxAge: 2 * 60 * 60 },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.uid = account.provider === "credentials" ? user.id : `${account.provider}:${account.providerAccountId}`;
      }
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
