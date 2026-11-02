"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

// Shows a one-off success toast after a redirect (e.g. ?claimed=1).
export function FlashToast({ message }: { message: string }) {
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast.success(message);
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState(null, "", url);
  }, [message]);
  return null;
}
