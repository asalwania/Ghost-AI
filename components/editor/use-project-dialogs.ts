"use client";

import { useMemo, useRef, useState } from "react";

export interface EditorProject {
  id: string;
  name: string;
  slug: string;
  updatedLabel: string;
  ownership: "owned" | "shared";
}

type ProjectDialog = "create" | "rename" | "delete" | null;

const INITIAL_PROJECTS: EditorProject[] = [
  {
    id: "project-1",
    name: "Payments Platform",
    slug: "payments-platform",
    updatedLabel: "Updated today",
    ownership: "owned",
  },
  {
    id: "project-2",
    name: "Realtime Analytics",
    slug: "realtime-analytics",
    updatedLabel: "Updated yesterday",
    ownership: "owned",
  },
  {
    id: "project-3",
    name: "Partner API Review",
    slug: "partner-api-review",
    updatedLabel: "Shared with you",
    ownership: "shared",
  },
];

function toSlug(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled-project"
  );
}

export function useProjectDialogs() {
  const nextProjectNumber = useRef(4);
  const [projects, setProjects] = useState<EditorProject[]>(INITIAL_PROJECTS);
  const [dialog, setDialog] = useState<ProjectDialog>(null);
  const [selectedProject, setSelectedProject] = useState<EditorProject | null>(
    null
  );
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slugPreview = useMemo(() => toSlug(projectName), [projectName]);

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

  const createProject = () => {
    const name = projectName.trim();

    if (!name) {
      return;
    }

    setIsLoading(true);
    setProjects((currentProjects) => [
      {
        id: `project-${nextProjectNumber.current++}`,
        name,
        slug: slugPreview,
        updatedLabel: "Just now",
        ownership: "owned",
      },
      ...currentProjects,
    ]);
    closeDialog();
  };

  const renameProject = () => {
    const name = projectName.trim();

    if (!name || !selectedProject) {
      return;
    }

    setIsLoading(true);
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              name,
              slug: slugPreview,
              updatedLabel: "Just now",
            }
          : project
      )
    );
    closeDialog();
  };

  const deleteProject = () => {
    if (!selectedProject) {
      return;
    }

    setIsLoading(true);
    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== selectedProject.id)
    );
    closeDialog();
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
