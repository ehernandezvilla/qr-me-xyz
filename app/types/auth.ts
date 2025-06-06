// app/types/auth.ts
import { User, Subscription, Plan } from "@prisma/client";

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

export interface ExtendedSession {
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

export interface ExtendedJWT {
  id?: string;
  username?: string | null;
  subscription?: (Subscription & { plan: Plan }) | null;
  currentQRCount?: number;
  monthlyQRCount?: number;
}