"use client";

import {
  AlertTriangle,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { EditorProject } from "@/hooks/use-project-actions";

type ProjectDialog = "create" | "rename" | "delete" | null;

export interface ProjectDialogsProps {
  dialog: ProjectDialog;
  selectedProject: EditorProject | null;
  projectName: string;
  slugPreview: string;
  isLoading: boolean;
  onProjectNameChange: (value: string) => void;
  onClose: () => void;
  onCreateProject: () => void;
  onRenameProject: () => void;
  onDeleteProject: () => void;
}

export function ProjectDialogs({
  dialog,
  selectedProject,
  projectName,
  slugPreview,
  isLoading,
  onProjectNameChange,
  onClose,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectDialogsProps) {
  const isCreateOpen = dialog === "create";
  const isRenameOpen = dialog === "rename";
  const isDeleteOpen = dialog === "delete";
  const canSubmitName = projectName.trim().length > 0;

  return (
    <>
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              onCreateProject();
            }}
          >
            <DialogHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-subtle text-brand">
                <FolderPlus className="h-5 w-5" />
              </div>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Name the workspace before moving into the canvas.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-copy-primary"
                htmlFor="create-project-name"
              >
                Project name
              </label>
              <Input
                id="create-project-name"
                value={projectName}
                onChange={(event) => onProjectNameChange(event.target.value)}
                placeholder="e.g. Checkout modernization"
                autoFocus
              />
            </div>

            <div className="rounded-2xl border border-surface-border bg-elevated p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copy-muted">
                Slug preview
              </p>
              <p className="mt-2 break-all font-mono text-sm text-brand">
                {slugPreview}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmitName || isLoading}>
                Create project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              onRenameProject();
            }}
          >
            <DialogHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-subtle text-brand">
                <Pencil className="h-5 w-5" />
              </div>
              <DialogTitle>Rename Project</DialogTitle>
              <DialogDescription>
                Current project name: {selectedProject?.name ?? "No project selected"}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-copy-primary"
                htmlFor="rename-project-name"
              >
                Project name
              </label>
              <Input
                id="rename-project-name"
                value={projectName}
                onChange={(event) => onProjectNameChange(event.target.value)}
                autoFocus
              />
            </div>

            <div className="rounded-2xl border border-surface-border bg-elevated p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copy-muted">
                Slug preview
              </p>
              <p className="mt-2 break-all font-mono text-sm text-brand">
                {slugPreview}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmitName || isLoading}>
                Save rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <div className="grid gap-5">
            <DialogHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-state-error/60 bg-elevated text-state-error">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle>Delete Project</DialogTitle>
              <DialogDescription>
                Delete {selectedProject?.name ?? "this project"}? This cannot be
                undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isLoading}
                onClick={onDeleteProject}
              >
                <Trash2 className="h-4 w-4" />
                Delete project
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
