import type { ReactNode } from "react";

import { Aurora } from "./aurora";

type StatusMessageProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

// Centered full-page message for 404s, inactive cards and similar dead ends.
export function StatusMessage({ title, description, action }: StatusMessageProps) {
  return (
    <main className="mx-auto flex w-full max-w-md grow flex-col items-center justify-center px-4 py-16 text-center">
      <Aurora />
      <div className="flex w-full animate-rise flex-col items-center gap-3 rounded-3xl glass px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </main>
  );
}
