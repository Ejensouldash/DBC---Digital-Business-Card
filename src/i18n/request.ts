import { getRequestConfig } from "next-intl/server";

// English only, without locale routing. Every UI string still lives in src/messages so
// another language can be added later without touching components.
export const APP_LOCALE = "en";

export default getRequestConfig(async () => ({
  locale: APP_LOCALE,
  messages: (await import(`../messages/${APP_LOCALE}.json`)).default,
}));
