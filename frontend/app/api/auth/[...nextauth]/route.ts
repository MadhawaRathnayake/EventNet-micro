import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

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
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/users/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
            headers: { 'Content-Type': 'application/json' }
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
        } catch (err) {
          console.error("Error logging in:", err);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    // Attach the id_token to the JWT
    async jwt({ token, account, user }) {
      if (account && account.id_token) {
        token.idToken = account.id_token;

        try {
          // Sync with user_service
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/users/auth/google`, {
            method: 'POST',
            body: JSON.stringify({ token: account.id_token }),
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (res.ok) {
            const data = await res.json();
            token.backendToken = data.token;
            token.role = data.user.role;
          } else {
            console.error("Failed to fetch backend token", await res.text());
          }
        } catch (err) {
          console.error("Error connecting to microservice:", err);
        }
      } else if (user && (user as any).backendToken) {
        // Handle credentials login
        token.backendToken = (user as any).backendToken;
        token.role = (user as any).role;
      }
      return token;
    },
    // Expose the tokens to the client session
    async session({ session, token }) {
      session.idToken = token.idToken as string;
      session.backendToken = token.backendToken as string;
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };