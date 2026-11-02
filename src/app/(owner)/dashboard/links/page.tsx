import { redirect } from "next/navigation";

// Links now live in a tab of the profile editor, next to the live preview.
export default async function LinksPage({ searchParams }: PageProps<"/dashboard/links">) {
  const { profile } = await searchParams;
  const query = new URLSearchParams({ tab: "links" });
  if (typeof profile === "string") query.set("profile", profile);
  redirect(`/dashboard/profile?${query}`);
}
