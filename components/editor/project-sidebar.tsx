"use client";

import { FolderOpen, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface ProjectSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

function EmptyProjectsState({ title }: { title: string }) {
  return (
    <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-base/40 px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-border bg-subtle text-copy-secondary">
        <FolderOpen className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-copy-primary">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-copy-muted">
        No projects have been added yet.
      </p>
    </div>
  );
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-4 top-20 z-30 flex h-[calc(100vh-6rem)] w-[19rem] flex-col rounded-3xl border border-surface-border bg-surface/95 p-4 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out sm:w-80",
        isOpen
          ? "translate-x-0"
          : "-translate-x-[calc(100%+1.5rem)] pointer-events-none"
      )}
      aria-hidden={!isOpen}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-copy-primary">Projects</h2>
          <p className="text-sm text-copy-muted">Organize shared design work.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="border border-surface-border bg-subtle text-copy-secondary hover:bg-elevated hover:text-copy-primary"
          onClick={onClose}
          aria-label="Close project sidebar"
          disabled={!onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Tabs defaultValue="my-project" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-project">My project</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value="my-project" className="flex min-h-0 flex-1 flex-col">
          <EmptyProjectsState title="Your projects will appear here." />
        </TabsContent>

        <TabsContent value="shared" className="flex min-h-0 flex-1 flex-col">
          <EmptyProjectsState title="Shared projects will appear here." />
        </TabsContent>
      </Tabs>

      <div className="pt-4">
        <Button type="button" className="w-full">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  );
}
