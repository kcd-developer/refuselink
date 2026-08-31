import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cache } from "react";

// Layouts and pages frequently need the same session during one render. React's
// request cache prevents each caller from repeating the auth/database work.
export const getSession = cache(() => getServerSession(authOptions));

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  userType: "platform" | "employee" | "customer";
  role?: string;
  companyId?: string;
  companySlug?: string;
}

export function getSessionUser(session: any): SessionUser | null {
  return session?.user ?? null;
}
