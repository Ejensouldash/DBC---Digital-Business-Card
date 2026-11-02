import { useTranslations } from "next-intl";

import { StatusMessage } from "@/components/shared/status-message";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return <StatusMessage title={t("title")} description={t("description")} />;
}
