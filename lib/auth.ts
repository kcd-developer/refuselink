import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

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
        if (!credentials?.email || !credentials?.password) return null;
        const { email, password, loginType, companySlug } = credentials;

        // Platform sign-in (also default if no loginType)
        if (loginType === "platform" || !loginType) {
          const user = await prisma.platformUser.findUnique({ where: { email } });
          if (!user || !user.isActive) return null;
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;
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
          if (!company || company.status === "suspended" || company.status === "cancelled") return null;

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
              if (access) {
                return {
                  id: customerUser.id,
                  email: customerUser.email,
                  name: customerUser.name,
                  userType: "customer",
                  companyId: company.id,
                  companySlug: company.slug,
                } as any;
              }
            }
          }
          return null;
        }

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
