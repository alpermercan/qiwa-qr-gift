import { createClient } from '@supabase/supabase-js';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email ve şifre gerekli');
        }

        const { data: admin, error } = await supabase
          .from('admins')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error || !admin) {
          throw new Error('Geçersiz email veya şifre');
        }

        const isValid = await compare(credentials.password, admin.password_hash);

        if (!isValid) {
          throw new Error('Geçersiz email veya şifre');
        }

        return {
          id: admin.id,
          email: admin.email,
        };
      }
    })
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST }; 