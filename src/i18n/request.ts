import { getRequestConfig } from "next-intl/server";

import { APP_LOCALE, APP_TIME_ZONE } from "@/lib/locale";

// No locale routing. Every UI string still lives in src/messages so another language can be
// added later without touching components.
export default getRequestConfig(async () => ({
  locale: APP_LOCALE,
  timeZone: APP_TIME_ZONE,
  messages: (await import(`../messages/${APP_LOCALE}.json`)).default,
}));
