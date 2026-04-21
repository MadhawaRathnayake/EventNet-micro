import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  // Extend the default Session interface
  interface Session {
    idToken?: string;
    user: {
      id: string;
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  // Extend the default JWT interface
  interface JWT {
    idToken?: string;
  }
}