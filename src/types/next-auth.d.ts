import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: "STUDENT" | "PARTICIPANT"
      uid?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    role: "STUDENT" | "PARTICIPANT"
    uid?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    role: "STUDENT" | "PARTICIPANT"
    uid?: string
  }
}