// Link attributes for the profile view. In the editor preview every link is inert.
const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" } as const;
const INERT = { tabIndex: -1, "aria-disabled": true } as const;

export function linkProps(preview: boolean, external = false) {
  if (preview) return INERT;
  return external ? NEW_TAB : {};
}
