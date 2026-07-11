import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Shown when a user tries to open a project workspace they cannot access:
 * the project doesn't exist, they are not the owner, and they are not a
 * collaborator.
 */
export function AccessDenied() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        {/* Lock icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-elevated text-copy-muted">
          <Lock className="h-8 w-8" />
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-copy-primary">
            Access Denied
          </h1>
          <p className="text-sm leading-6 text-copy-muted">
            This project doesn&apos;t exist or you don&apos;t have permission to
            view it.
          </p>
        </div>

        {/* Back link */}
        <Button asChild>
          <Link href="/editor">Back to editor</Link>
        </Button>
      </div>
    </div>
  );
}
