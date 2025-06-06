// app/types/auth.ts
import { User, Subscription, Plan } from "@prisma/client";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

export interface ExtendedUser extends User {
  subscription?: (Subscription & { plan: Plan }) | null;
}

export interface CustomUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  username?: string | null;
}

// Extender JWT de NextAuth en lugar de crear uno nuevo
export interface ExtendedJWT extends JWT {
  id?: string;
  username?: string | null;
  subscription?: (Subscription & { plan: Plan }) | null;
  currentQRCount?: number;
  monthlyQRCount?: number;
}

// Extender Session de NextAuth
export interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
    subscription?: (Subscription & { plan: Plan }) | null;
    currentQRCount?: number;
    monthlyQRCount?: number;
  };
}