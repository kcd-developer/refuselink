import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

type AuthFailureReason =
  | "missing_credentials"
  | "account_not_found"
  | "account_inactive"
  | "password_mismatch"
  | "company_unavailable"
  | "company_access_missing"
  | "invalid_login_context";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function logAuthFailure(reason: AuthFailureReason, email?: string, companySlug?: string) {
  const emailFingerprint = email
    ? createHash("sha256").update(normalizeEmail(email)).digest("hex").slice(0, 12)
    : undefined;

  console.warn("Authentication rejected", {
    reason,
    companySlug: companySlug || undefined,
    emailFingerprint,
  });
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" },
        companySlug: { label: "Company Slug", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logAuthFailure("missing_credentials");
          return null;
        }
        const email = normalizeEmail(credentials.email);
        const { password, loginType, companySlug } = credentials;

        // Platform sign-in (also default if no loginType)
        if (loginType === "platform" || !loginType) {
          const user = await prisma.platformUser.findUnique({ where: { email } });
          if (!user) {
            logAuthFailure("account_not_found", email);
            return null;
          }
          if (!user.isActive) {
            logAuthFailure("account_inactive", email);
            return null;
          }
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) {
            logAuthFailure("password_mismatch", email);
            return null;
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: "platform",
            role: user.role,
          } as any;
        }

        // Company sign-in (employees + customers)
        if (loginType === "company" && companySlug) {
          const company = await prisma.company.findUnique({
            where: { slug: companySlug },
          });
          if (!company || company.status === "suspended" || company.status === "cancelled") {
            logAuthFailure("company_unavailable", email, companySlug);
            return null;
          }

          // Try employee first
          const employee = await prisma.companyUser.findUnique({
            where: { companyId_email: { companyId: company.id, email } },
          });
          if (employee && employee.isActive) {
            const valid = await bcrypt.compare(password, employee.password);
            if (valid) {
              return {
                id: employee.id,
                email: employee.email,
                name: employee.name,
                userType: "employee",
                companyId: company.id,
                companySlug: company.slug,
                role: employee.role,
              } as any;
            }
          }

          // Try customer user
          const customerUser = await prisma.customerUser.findUnique({
            where: { email },
          });
          if (customerUser && customerUser.isActive) {
            const valid = await bcrypt.compare(password, customerUser.password);
            if (valid) {
              // Verify customer has access to an account in this company
              const access = await prisma.customerUserAccess.findFirst({
                where: {
                  customerUserId: customerUser.id,
                  customer: { companyId: company.id },
                },
              });
              const communityMembership = access ? null : await prisma.communityMembership.findFirst({
                where: {
                  customerUserId: customerUser.id,
                  isActive: true,
                  community: { companyId: company.id },
                },
              });
              if (access || communityMembership) {
                return {
                  id: customerUser.id,
                  email: customerUser.email,
                  name: customerUser.name,
                  userType: "customer",
                  companyId: company.id,
                  companySlug: company.slug,
                } as any;
              }
              logAuthFailure("company_access_missing", email, companySlug);
              return null;
            }
          }
          const matchingAccounts = [employee, customerUser].filter(Boolean);
          logAuthFailure(
            matchingAccounts.length === 0
              ? "account_not_found"
              : matchingAccounts.every((account) => !account?.isActive)
                ? "account_inactive"
                : "password_mismatch",
            email,
            companySlug,
          );
          return null;
        }

        logAuthFailure("invalid_login_context", email, companySlug);
        return null;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: {
    signIn: "/platform/sign-in",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.userId = user.id;
        token.userType = user.userType;
        token.role = user.role;
        token.companyId = user.companyId;
        token.companySlug = user.companySlug;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.userId;
        session.user.userType = token.userType;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.companySlug = token.companySlug;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
