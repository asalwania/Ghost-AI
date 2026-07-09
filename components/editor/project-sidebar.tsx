"use client";

import { FolderOpen, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EditorProject } from "@/components/editor/use-project-dialogs";
import { cn } from "@/lib/utils";

export interface ProjectSidebarProps {
  isOpen: boolean;
  projects: EditorProject[];
  onClose?: () => void;
  onCreateProject: () => void;
  onRenameProject: (project: EditorProject) => void;
  onDeleteProject: (project: EditorProject) => void;
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

function ProjectList({
  projects,
  showActions,
  onRenameProject,
  onDeleteProject,
}: {
  projects: EditorProject[];
  showActions: boolean;
  onRenameProject: (project: EditorProject) => void;
  onDeleteProject: (project: EditorProject) => void;
}) {
  if (projects.length === 0) {
    return <EmptyProjectsState title="No projects in this view." />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
      {projects.map((project) => (
        <div
          className="group flex items-center gap-3 rounded-2xl border border-surface-border bg-base/50 p-3 transition-colors hover:bg-elevated"
          key={project.id}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-subtle text-copy-secondary">
            <FolderOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-copy-primary">
              {project.name}
            </p>
            <p className="truncate font-mono text-xs text-copy-muted">
              {project.slug}
            </p>
            <p className="mt-1 text-xs text-copy-faint">{project.updatedLabel}</p>
          </div>
          {showActions ? (
            <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-copy-muted hover:bg-subtle hover:text-copy-primary"
                onClick={() => onRenameProject(project)}
                aria-label={`Rename ${project.name}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-copy-muted hover:bg-subtle hover:text-state-error"
                onClick={() => onDeleteProject(project)}
                aria-label={`Delete ${project.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  projects,
  onClose,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  const ownedProjects = projects.filter((project) => project.ownership === "owned");
  const sharedProjects = projects.filter(
    (project) => project.ownership === "shared"
  );

  return (
    <>
      <button
        type="button"
        className={cn(
          "fixed inset-0 z-20 bg-base/70 backdrop-blur-sm transition-opacity sm:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-label="Close project sidebar"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
      />
      <aside
        className={cn(
          "fixed left-4 top-20 z-30 flex h-[calc(100vh-6rem)] w-[19rem] flex-col rounded-3xl border border-surface-border bg-surface/95 p-4 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out sm:w-80",
          isOpen
            ? "translate-x-0"
            : "pointer-events-none -translate-x-[calc(100%+1.5rem)]"
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
            <ProjectList
              projects={ownedProjects}
              showActions
              onRenameProject={onRenameProject}
              onDeleteProject={onDeleteProject}
            />
          </TabsContent>

          <TabsContent value="shared" className="flex min-h-0 flex-1 flex-col">
            <ProjectList
              projects={sharedProjects}
              showActions={false}
              onRenameProject={onRenameProject}
              onDeleteProject={onDeleteProject}
            />
          </TabsContent>
        </Tabs>

        <div className="pt-4">
          <Button type="button" className="w-full" onClick={onCreateProject}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </div>
      </aside>
    </>
  );
}
