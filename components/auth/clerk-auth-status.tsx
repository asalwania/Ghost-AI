"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { ClerkFailed, ClerkLoaded, ClerkLoading, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { editorPath } from "@/lib/clerk";

interface ClerkAuthStatusProps {
  children: ReactNode;
}

/**
 * Redirect guard: if Clerk loads and finds an active session on the client
 * (e.g. after a fresh tab open in dev mode where the server-side cookie
 * handshake wasn't complete yet), push the user straight to the editor
 * instead of showing the sign-in form.
 */
function AlreadySignedInRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(editorPath);
    }
  }, [isLoaded, isSignedIn, router]);

  return null;
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

      <ClerkLoaded>
        <AlreadySignedInRedirect />
        {children}
      </ClerkLoaded>
    </>
  );
}
