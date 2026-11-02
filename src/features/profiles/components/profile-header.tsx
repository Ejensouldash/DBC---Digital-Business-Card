import Image from "next/image";

import { cn } from "@/lib/utils";

type ProfileHeaderProps = {
  displayName: string;
  subtitle: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  compact: boolean;
  preview: boolean;
};

// Cover (or an accent glow when there's none), avatar with a slowly turning ring, name.
export function ProfileHeader({
  displayName,
  subtitle,
  avatarUrl,
  coverUrl,
  compact,
  preview,
}: ProfileHeaderProps) {
  return (
    <>
      {compact ? null : (
        <div className="relative h-36 w-full overflow-hidden">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              priority={!preview}
              unoptimized={preview}
              sizes="(max-width: 480px) 100vw, 480px"
              className="object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--accent-soft),transparent_70%)] opacity-40"
            />
          )}
          {/* Fade the cover into the card so the avatar sits on glass, not on the photo. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0d1224]/90"
          />
        </div>
      )}
      <div
        className={cn(
          "flex animate-rise flex-col items-center gap-3 px-5 text-center",
          compact ? "pt-8" : "-mt-14",
        )}
      >
        <div className="relative size-28">
          <div
            aria-hidden
            className="absolute animate-spin-slow rounded-full opacity-90"
            style={{
              inset: -6,
              background:
                "conic-gradient(from 0deg, var(--accent-soft), transparent 35%, var(--primary), transparent 75%, var(--accent-soft))",
            }}
          />
          <div className="relative size-full overflow-hidden rounded-full bg-[#11162a] ring-2 ring-[#0d1224]">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                priority={!preview}
                unoptimized={preview}
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex size-full items-center justify-center text-4xl font-semibold text-accent-soft"
              >
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{displayName}</h1>
          {subtitle ? <p className="mt-1 text-muted-foreground">{subtitle}</p> : null}
        </header>
      </div>
    </>
  );
}
