// app/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { CustomUser } from "@/app/types/auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { 
            subscription: { 
              include: { plan: true } 
            } 
          }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          username: user.username,
        };
      }
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        token.id = customUser.id;
        token.username = customUser.username;
      }

      // Refresh user data on each request
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { 
            subscription: { 
              include: { plan: true } 
            } 
          }
        });

        if (dbUser) {
          token.username = dbUser.username;
          token.subscription = dbUser.subscription;
          token.currentQRCount = dbUser.currentQRCount;
          token.monthlyQRCount = dbUser.monthlyQRCount;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.username = token.username;
        session.user.subscription = token.subscription;
        session.user.currentQRCount = token.currentQRCount;
        session.user.monthlyQRCount = token.monthlyQRCount;
      }
      
      return session;
    },

    async signIn({ user, account }) {
      if (user) {
        console.log("User signed in:", user);
      }
      // Solo permitir el provider credentials por ahora
      if (account?.provider === "credentials") {
        return true;
      }
      return false;
    },
  },

  pages: {
    signIn: "/login",
  },

  debug: process.env.NODE_ENV === "development",
};

// Helper functions para usar en tu app
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function createUserWithFreePlan(data: {
  email: string;
  password: string;
  name?: string;
  username?: string;
}) {
  const hashedPassword = await hashPassword(data.password);
  
  // Buscar el plan gratuito
  const freePlan = await prisma.plan.findUnique({
    where: { name: 'free' }
  });

  if (!freePlan) {
    throw new Error('Free plan not found');
  }

  // Crear usuario con suscripción gratuita
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      username: data.username,
      subscription: {
        create: {
          planId: freePlan.id,
          status: 'active',
        }
      }
    },
    include: {
      subscription: {
        include: { plan: true }
      }
    }
  });

  return user;
}