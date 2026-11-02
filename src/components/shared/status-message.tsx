import type { ReactNode } from "react";

type StatusMessageProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

// Centered full-page message for 404s, inactive cards and similar dead ends.
export function StatusMessage({ title, description, action }: StatusMessageProps) {
  return (
    <main className="mx-auto flex w-full max-w-md grow flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </main>
  );
}
