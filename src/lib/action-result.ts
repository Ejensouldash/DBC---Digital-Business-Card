// Server Actions never throw to the UI; they return one of these.
// `error` is a stable code the client maps to a translated message.
export type ActionResult<T = undefined, E extends string = string> =
  { ok: true; data: T } | { ok: false; error: E };

export function ok(): ActionResult<undefined, never>;
export function ok<T>(data: T): ActionResult<T, never>;
export function ok<T>(data?: T): ActionResult<T | undefined, never> {
  return { ok: true, data };
}

export function fail<E extends string>(error: E): ActionResult<never, E> {
  return { ok: false, error };
}
