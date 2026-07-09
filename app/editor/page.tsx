"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { useProjectDialogs } from "@/components/editor/use-project-dialogs";
import { Button } from "@/components/ui/button";

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const projectDialogs = useProjectDialogs();

  return (
    <div className="relative min-h-screen overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        projects={projectDialogs.projects}
        onClose={() => setIsSidebarOpen(false)}
        onCreateProject={projectDialogs.openCreateDialog}
        onRenameProject={projectDialogs.openRenameDialog}
        onDeleteProject={projectDialogs.openDeleteDialog}
      />

      <main className="flex min-h-screen items-center justify-center px-4 pt-20 pb-4 sm:px-6">
        <section className="max-w-xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-copy-primary sm:text-4xl">
            Create a project or open an existing one
          </h1>
          <p className="mt-4 text-base leading-7 text-copy-secondary">
            Start a new architecture workspace or choose the project from the sidebar
          </p>
          <div className="mt-7 flex justify-center">
            <Button type="button" onClick={projectDialogs.openCreateDialog}>
              <Plus className="h-4 w-4" />
              New project
            </Button>
          </div>
        </section>
      </main>

      <ProjectDialogs
        dialog={projectDialogs.dialog}
        selectedProject={projectDialogs.selectedProject}
        projectName={projectDialogs.projectName}
        slugPreview={projectDialogs.slugPreview}
        isLoading={projectDialogs.isLoading}
        onProjectNameChange={projectDialogs.setProjectName}
        onClose={projectDialogs.closeDialog}
        onCreateProject={projectDialogs.createProject}
        onRenameProject={projectDialogs.renameProject}
        onDeleteProject={projectDialogs.deleteProject}
      />
    </div>
  );
}
