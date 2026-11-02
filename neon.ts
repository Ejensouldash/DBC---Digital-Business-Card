import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Managed Better Auth: users and sessions live in the `neon_auth` schema.
  auth: true,
  // Avatars and covers: anonymous reads, writes only from our server.
  buckets: {
    avatars: { access: "public_read" },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
