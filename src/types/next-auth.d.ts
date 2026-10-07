import { DefaultSession } from "next-auth";
import type { AppRole } from "./index";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      chapterId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
    chapterId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: AppRole;
    chapterId: string | null;
  }
}
