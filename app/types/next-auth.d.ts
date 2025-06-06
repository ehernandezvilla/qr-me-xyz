// app/types/next-auth.d.ts
import { Subscription, Plan } from "@prisma/client";

declare module "next-auth" {
  interface Session {
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

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    username?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
    subscription?: (Subscription & { plan: Plan }) | null;
    currentQRCount?: number;
    monthlyQRCount?: number;
  }
}