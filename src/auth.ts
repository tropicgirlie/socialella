import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const password = credentials?.password as string | undefined;
        const hash = process.env.APP_PASSWORD_HASH;
        if (!password || !hash) {
          return null;
        }
        const ok = await bcrypt.compare(password, hash);
        if (!ok) return null;
        return {
          id: "solo",
          name: "Founder",
          email: "solo@socialella.local",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  trustHost: true,
});
