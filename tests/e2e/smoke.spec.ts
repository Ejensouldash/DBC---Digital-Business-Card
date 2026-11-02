import { expect, test } from "@playwright/test";

const profileSlug = process.env.E2E_PROFILE_SLUG;

test.describe("public pages", () => {
  test("landing page links to sign-in and the privacy notice", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Privacy notice" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  test("login page asks for an email address", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("privacy notice is published in English and Malay", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator('section[lang="en"] h2')).toHaveText("Privacy notice");
    await expect(page.locator('section[lang="ms"] h2')).toHaveText("Notis privasi");
  });

  test("unknown profile shows the not-found page", async ({ page }) => {
    await page.goto("/p/no-such-profile-e2e");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});

test.describe("NFC entry /c/[code]", () => {
  test("a malformed code redirects to the invalid card page", async ({ page }) => {
    const response = await page.request.get("/c/not-a-code", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toContain("/card/invalid");
    expect(response.headers()["cache-control"]).toContain("no-store");

    await page.goto("/c/not-a-code");
    await expect(page.getByRole("heading", { name: "Invalid card" })).toBeVisible();
  });

  test("a well-formed code that doesn't exist shows the inactive page", async ({ page }) => {
    await page.goto("/c/22222222");
    await expect(page).toHaveURL(/\/card\/inactive$/);
    await expect(page.getByRole("heading", { name: "Card not active" })).toBeVisible();
  });
});

test.describe("signed-out access", () => {
  for (const path of ["/dashboard", "/admin/cards"]) {
    test(`${path} sends visitors to login and back`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(
        (url) => url.pathname === "/login" && url.searchParams.get("next") === path,
      );
    });
  }
});

test.describe("published profile", () => {
  test.skip(!profileSlug, "Set E2E_PROFILE_SLUG to a published profile to run these");

  test("shows the owner and Save Contact buttons", async ({ page }) => {
    await page.goto(`/p/${profileSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hi! I am");
    // Hero, sticky bar and contact card all offer it.
    const saveContact = page.getByRole("link", { name: "Save Contact" });
    await expect(saveContact.first()).toBeVisible();
    for (const link of await saveContact.all()) {
      await expect(link).toHaveAttribute("href", `/api/vcard/${profileSlug}`);
    }
  });

  test("sticky bar appears after scrolling past the hero", async ({ page }) => {
    await page.goto(`/p/${profileSlug}`);
    const bar = page.locator(".sticky > div");
    await expect(bar).toHaveAttribute("inert", "");
    await page.mouse.wheel(0, 900);
    await expect(bar).not.toHaveAttribute("inert");
  });

  test("serves a vCard 3.0 file", async ({ request }) => {
    const response = await request.get(`/api/vcard/${profileSlug}`);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("text/vcard");
    const body = await response.text();
    expect(body.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(body.trimEnd().endsWith("END:VCARD")).toBe(true);
  });
});
