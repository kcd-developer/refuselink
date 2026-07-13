import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}

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
