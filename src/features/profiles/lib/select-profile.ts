// Picks the profile named in ?profile=<id>, falling back to the owner's first profile.
export function selectProfile<T extends { id: string }>(
  profiles: T[],
  requested: string | string[] | undefined,
): T | null {
  return profiles.find((profile) => profile.id === requested) ?? profiles[0] ?? null;
}
