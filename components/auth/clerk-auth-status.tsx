"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { ClerkFailed, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

interface ClerkAuthStatusProps {
  children: ReactNode;
}

export function ClerkAuthStatus({ children }: ClerkAuthStatusProps) {
  return (
    <>
      <ClerkLoading>
        <div className="flex min-h-72 w-[min(100vw-4rem,28rem)] flex-col items-center justify-center gap-4 rounded-2xl border border-surface-border bg-surface px-6 py-10 text-center shadow-[0_18px_64px_rgba(0,0,0,0.32)]">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-copy-primary">
              Loading secure sign-in
            </p>
            <p className="text-sm leading-6 text-copy-secondary">
              Connecting to the authentication service.
            </p>
          </div>
        </div>
      </ClerkLoading>

      <ClerkFailed>
        <div className="flex min-h-72 w-[min(100vw-4rem,28rem)] flex-col items-center justify-center gap-5 rounded-2xl border border-surface-border bg-surface px-6 py-10 text-center shadow-[0_18px_64px_rgba(0,0,0,0.32)]">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-surface-border bg-subtle text-warning">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-copy-primary">
              Authentication could not load
            </p>
            <p className="text-sm leading-6 text-copy-secondary">
              Check network access to Clerk, then refresh this page.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </ClerkFailed>

      <ClerkLoaded>{children}</ClerkLoaded>
    </>
  );
}
