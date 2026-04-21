import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  session: {
    strategy: 'jwt'
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Attach the id_token to the JWT
    async jwt({ token, account }) {
      if (account) {
        token.idToken = account.id_token;
      }
      return token;
    },
    // Expose the id_token to the client session
    async session({ session, token }) {
      session.idToken = token.idToken as string;
      return session;
    },
  },
});

export { handler as GET, handler as POST };