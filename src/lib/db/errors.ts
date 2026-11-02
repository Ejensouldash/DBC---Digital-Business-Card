// Postgres unique_violation, possibly wrapped by Drizzle's DrizzleQueryError.
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  const candidates = [error, error instanceof Error ? error.cause : undefined];
  return candidates.some(
    (candidate) =>
      typeof candidate === "object" &&
      candidate !== null &&
      "code" in candidate &&
      candidate.code === "23505" &&
      "constraint" in candidate &&
      candidate.constraint === constraint,
  );
}
