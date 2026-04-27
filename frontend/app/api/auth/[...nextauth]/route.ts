import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

type AuthUserLike = {
  backendToken?: string;
  role?: string;
};

const toNumericIdString = (value: unknown): string => {
  const stringValue = String(value ?? "").trim();
  return /^\d+$/.test(stringValue) ? stringValue : "";
};

// NextAuth route handlers run on the server (Node), so backend calls MUST use an absolute URL.
// IMPORTANT: don't throw at module-evaluation time (breaks `next build` inside Docker).
const getBackendApiBaseUrl = (): string => {
  const base =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    (process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api` : "");
  return base;
};

const safeBackendFetch = async (path: string, body: Record<string, unknown>) => {
  const baseUrl = getBackendApiBaseUrl();
  if (!baseUrl.startsWith("http")) {
    throw new Error("BACKEND_API_URL_NOT_CONFIGURED");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(`${baseUrl}${path}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const handler = NextAuth({
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await safeBackendFetch("/users/auth/login", {
            email: credentials.email,
            password: credentials.password,
          });
          const data = await res.json();
          if (res.ok && data.user) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim() || data.user.email,
              role: data.user.role,
              backendToken: data.token
            };
          }
          return null;
        } catch {
          // Backend service unavailable or timeout; return null so UI shows login failure cleanly.
          return null;
        }
      }
    }),
  ],
  callbacks: {
    // Attach the id_token to the JWT
    async jwt({ token, account, user }) {
      if (user?.id) {
        token.userId = toNumericIdString(user.id);
      }
      if (account && account.id_token) {
        token.idToken = account.id_token;

        try {
          // Sync with user_service
          const res = await safeBackendFetch("/users/auth/google", {
            token: account.id_token,
          });
          
          if (res.ok) {
            const data = await res.json();
            token.backendToken = data.token;
            token.role = data.user.role;
            token.userId = toNumericIdString(data.user?.id);
          }
        } catch {
          // Ignore backend sync failures; session can still proceed with provider token.
        }
      } else if (user && typeof user === "object" && "backendToken" in user) {
        const typedUser = user as AuthUserLike;
        // Handle credentials login
        token.backendToken = typedUser.backendToken;
        token.role = typedUser.role;
      }
      return token;
    },
    // Expose the tokens to the client session
    async session({ session, token }) {
      session.idToken = token.idToken as string;
      session.backendToken = token.backendToken as string;
      if (session.user) {
        session.user.id = toNumericIdString(token.userId);
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };