import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      userType: "platform" | "employee" | "customer";
      role?: string;
      companyId?: string;
      companySlug?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    userType: "platform" | "employee" | "customer";
    role?: string;
    companyId?: string;
    companySlug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    userType: "platform" | "employee" | "customer";
    role?: string;
    companyId?: string;
    companySlug?: string;
  }
}
