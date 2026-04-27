import { DefaultSession } from "next-auth"

declare module "next-auth" {
  // Extend the default Session interface
  interface Session {
    idToken?: string;
    backendToken?: string;
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  // Extend the default JWT interface
  interface JWT {
    idToken?: string;
    backendToken?: string;
    role?: string;
    userId?: string;
  }
}