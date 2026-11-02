// Postgres errors arrive either directly or wrapped by Drizzle's DrizzleQueryError (as `cause`).
function pgErrors(error: unknown): Record<string, unknown>[] {
  return [error, error instanceof Error ? error.cause : undefined].filter(
    (candidate): candidate is Record<string, unknown> =>
      typeof candidate === "object" && candidate !== null,
  );
}

export function isUniqueViolation(error: unknown, constraint: string): boolean {
  return pgErrors(error).some(
    (candidate) => candidate.code === "23505" && candidate.constraint === constraint,
  );
}

// An error raised by our own SQL, e.g. `RAISE EXCEPTION 'lead_rate_limited' USING ERRCODE = 'P0001'`.
export function isRaisedException(error: unknown, message: string): boolean {
  return pgErrors(error).some(
    (candidate) => candidate.code === "P0001" && candidate.message === message,
  );
}
