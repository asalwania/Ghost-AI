"use client";

import { Menu } from "lucide-react";
import {
  PanelLeftClose as PaneLeftClose,
  PanelLeftOpen as PaneLeftOpen,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 h-16 border-b border-surface-border bg-surface/95 backdrop-blur-md",
        "shadow-[inset_0_-1px_0_var(--border-subtle)]"
      )}
    >
      <div className="flex h-full items-center px-4 sm:px-6">
        <div className="flex w-1/3 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="border border-surface-border bg-subtle text-copy-secondary hover:bg-elevated hover:text-copy-primary"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close project sidebar" : "Open project sidebar"}
          >
            {isSidebarOpen ? (
              <PaneLeftClose className="h-5 w-5" />
            ) : (
              <PaneLeftOpen className="h-5 w-5" />
            )}
          </Button>
          <div className="hidden min-[520px]:flex min-w-0 items-center gap-2 text-sm text-copy-secondary">
            <Menu className="h-4 w-4 text-brand" />
            <span className="truncate font-medium text-copy-primary">Ghost AI Editor</span>
          </div>
        </div>

        <div className="flex w-1/3 justify-center px-4">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm font-semibold tracking-[0.18em] text-copy-primary uppercase">
              Canvas Workspace
            </span>
            <span className="text-xs text-copy-muted">Base chrome for editor screens</span>
          </div>
        </div>

        <div className="flex w-1/3 items-center justify-end">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "h-9 w-9 border border-surface-border shadow-[0_0_0_1px_var(--border-subtle)]",
                userButtonTrigger:
                  "rounded-xl focus:shadow-[0_0_0_3px_var(--accent-primary-dim)]",
                userButtonPopoverCard: {
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                },
                userButtonPopoverActionButton: {
                  color: "var(--text-primary)",
                  fontWeight: 500,
                },
                userButtonPopoverActionButtonIcon: {
                  color: "var(--text-secondary)",
                },
                userButtonPopoverFooterPagesLink: {
                  color: "var(--text-muted)",
                },
              },
            }}
            showName={false}
          />
        </div>
      </div>
    </header>
  );
}
