// Gives an existing user admin access (bootstraps the first admin; later ones can be promoted
// from /admin/users). The user must have signed in at least once.
//   pnpm admin:promote you@example.com
// Needs the Neon CLI signed in (`neon login`) and linked to this project.
import { execFileSync } from "node:child_process";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { neonAuthUser } from "../src/lib/db/neon-auth";

import { connect, runScript } from "./db";

void runScript(async () => {
  const email = z.email().safeParse(process.argv[2]?.trim().toLowerCase());
  if (!email.success) throw new Error("Usage: pnpm admin:promote you@example.com");

  const { db, close } = connect();
  try {
    const [user] = await db
      .select({ id: neonAuthUser.id, role: neonAuthUser.role })
      .from(neonAuthUser)
      .where(eq(neonAuthUser.email, email.data))
      .limit(1);
    if (!user) throw new Error(`No user with email ${email.data}. Sign in once first.`);
    if (user.role === "admin") return console.log(`${email.data} is already an admin.`);

    // Role changes go through Neon Auth (not SQL) so its session cache stays consistent.
    execFileSync("neon", ["neon-auth", "user", "set-role", user.id, "--roles", "admin"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    console.log(`${email.data} is now an admin. Sign out and in again to see /admin.`);
  } finally {
    await close();
  }
});
