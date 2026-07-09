"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { toSlugPreview } from "@/lib/project-utils";

// Re-export so existing consumers that import EditorProject from this file
// continue to compile without changes.
export type { EditorProject } from "@/lib/project-utils";

type ProjectDialog = "create" | "rename" | "delete" | null;

export function useProjectActions(initialProjects: EditorProject[]) {
  const router = useRouter();
  const [projects, setProjects] = useState<EditorProject[]>(initialProjects);
  const [dialog, setDialog] = useState<ProjectDialog>(null);
  const [selectedProject, setSelectedProject] = useState<EditorProject | null>(
    null
  );
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slugPreview = useMemo(
    () => toSlugPreview(projectName),
    [projectName]
  );

  const closeDialog = () => {
    setDialog(null);
    setSelectedProject(null);
    setProjectName("");
    setIsLoading(false);
  };

  const openCreateDialog = () => {
    setDialog("create");
    setSelectedProject(null);
    setProjectName("");
    setIsLoading(false);
  };

  const openRenameDialog = (project: EditorProject) => {
    setDialog("rename");
    setSelectedProject(project);
    setProjectName(project.name);
    setIsLoading(false);
  };

  const openDeleteDialog = (project: EditorProject) => {
    setDialog("delete");
    setSelectedProject(project);
    setProjectName(project.name);
    setIsLoading(false);
  };

  const createProject = async () => {
    const name = projectName.trim() || "Untitled Project";
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        throw new Error("Failed to create project");
      }
      const { project } = (await res.json()) as {
        project: { id: string; name: string; updatedAt: string };
      };
      closeDialog();
      router.push(`/editor/${project.id}`);
    } catch {
      setIsLoading(false);
    }
  };

  const renameProject = async () => {
    const name = projectName.trim();
    if (!name || !selectedProject) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        throw new Error("Failed to rename project");
      }
      closeDialog();
      router.refresh();
    } catch {
      setIsLoading(false);
    }
  };

  const deleteProject = async () => {
    if (!selectedProject) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete project");
      }
      // Optimistically remove from local list.
      setProjects((current) =>
        current.filter((p) => p.id !== selectedProject.id)
      );
      closeDialog();
      router.refresh();
    } catch {
      setIsLoading(false);
    }
  };

  return {
    projects,
    dialog,
    selectedProject,
    projectName,
    slugPreview,
    isLoading,
    setProjectName,
    closeDialog,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    createProject,
    renameProject,
    deleteProject,
  };
}
