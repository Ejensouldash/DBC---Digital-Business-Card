import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { auth } from "./server";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

// One session lookup per request, shared by layouts, pages and actions.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  // Session reads are request-time only; stop prerendering here instead of inside the SDK.
  await connection();
  const { data } = await auth.getSession();
  const user = data?.user;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    // Better Auth admin plugin role, managed by Neon Auth (not in the SDK's base user type).
    isAdmin: "role" in user && user.role === "admin",
  };
});

// For pages: send signed-out visitors to login and come back afterwards.
export async function requireUser(returnTo: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user) return user;
  redirect(`/login?next=${encodeURIComponent(returnTo)}`);
}
