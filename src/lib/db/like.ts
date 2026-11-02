// Escapes user input for use inside a LIKE/ILIKE pattern, so % and _ match literally.
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
