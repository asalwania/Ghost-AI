"use client";

import { useState } from "react";
import { BotMessageSquare, Share2 } from "lucide-react";

import { CanvasRoom } from "@/components/editor/canvas-room";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { Button } from "@/components/ui/button";
import type { EditorProject } from "@/hooks/use-project-actions";
import { useProjectActions } from "@/hooks/use-project-actions";
import { useShareDialog } from "@/hooks/use-share-dialog";
import { cn } from "@/lib/utils";

interface WorkspaceNavbarProps {
  projectName: string;
  isSidebarOpen: boolean;
  isAiPanelOpen: boolean;
  onToggleSidebar: () => void;
  onToggleAiPanel: () => void;
  onShare: () => void;
}

function WorkspaceNavbar({
  projectName,
  isSidebarOpen,
  isAiPanelOpen,
  onToggleSidebar,
  onToggleAiPanel,
  onShare,
}: WorkspaceNavbarProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 h-16 border-b border-surface-border bg-surface/95 backdrop-blur-md",
        "shadow-[inset_0_-1px_0_var(--border-subtle)]"
      )}
    >
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        {/* Left: sidebar toggle */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            id="workspace-sidebar-toggle"
            type="button"
            variant="ghost"
            size="icon"
            className="border border-surface-border bg-subtle text-copy-secondary hover:bg-elevated hover:text-copy-primary"
            onClick={onToggleSidebar}
            aria-label={
              isSidebarOpen ? "Close project sidebar" : "Open project sidebar"
            }
          >
            {/* Simple grid/hamburger icon pairs with the existing editor chrome */}
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-5 w-5"
              aria-hidden
            >
              {isSidebarOpen ? (
                <>
                  <rect x="3" y="3" width="6" height="14" rx="1" />
                  <line x1="13" y1="7" x2="17" y2="7" />
                  <line x1="13" y1="10" x2="17" y2="10" />
                  <line x1="13" y1="13" x2="17" y2="13" />
                </>
              ) : (
                <>
                  <rect
                    x="3"
                    y="3"
                    width="6"
                    height="14"
                    rx="1"
                    strokeDasharray="2 1"
                    opacity="0.4"
                  />
                  <line x1="13" y1="7" x2="17" y2="7" />
                  <line x1="13" y1="10" x2="17" y2="10" />
                  <line x1="13" y1="13" x2="17" y2="13" />
                </>
              )}
            </svg>
          </Button>
        </div>

        {/* Center: project name */}
        <div className="min-w-0 flex-1 text-center">
          <span
            id="workspace-project-name"
            className="truncate text-sm font-semibold tracking-wide text-copy-primary"
          >
            {projectName}
          </span>
        </div>

        {/* Right: share + AI sidebar toggle */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            id="workspace-share-btn"
            type="button"
            variant="outline"
            size="sm"
            onClick={onShare}
            className="border-surface-border bg-subtle text-copy-secondary hover:bg-elevated hover:text-copy-primary"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          <Button
            id="workspace-ai-panel-toggle"
            type="button"
            variant={isAiPanelOpen ? "default" : "outline"}
            size="sm"
            className={cn(
              isAiPanelOpen
                ? "border-ai/40 bg-ai/20 text-ai-text hover:bg-ai/30"
                : "border-surface-border bg-subtle text-copy-secondary hover:bg-elevated hover:text-copy-primary"
            )}
            onClick={onToggleAiPanel}
            aria-label={isAiPanelOpen ? "Close AI sidebar" : "Open AI sidebar"}
          >
            <BotMessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

interface WorkspaceShellProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  initialProjects: EditorProject[];
}

export function WorkspaceShell({
  projectId,
  projectName,
  isOwner,
  initialProjects,
}: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const projectActions = useProjectActions(initialProjects);
  const shareDialog = useShareDialog({ projectId, isOwner });

  return (
    <div className="relative flex h-screen overflow-hidden bg-base">
      {/* Top navbar */}
      <WorkspaceNavbar
        projectName={projectName}
        isSidebarOpen={isSidebarOpen}
        isAiPanelOpen={isAiPanelOpen}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        onToggleAiPanel={() => setIsAiPanelOpen((v) => !v)}
        onShare={() => shareDialog.setOpen(true)}
      />

      {/* Project sidebar (left) */}
      <ProjectSidebar
        isOpen={isSidebarOpen}
        projects={projectActions.projects}
        activeProjectId={projectId}
        onClose={() => setIsSidebarOpen(false)}
        onCreateProject={projectActions.openCreateDialog}
        onRenameProject={projectActions.openRenameDialog}
        onDeleteProject={projectActions.openDeleteDialog}
      />

      {/* Canvas (center) */}
      <main
        id="workspace-canvas"
        className="relative flex flex-1 bg-base pt-16"
      >
        <CanvasRoom roomId={projectId} />
      </main>

      {/* AI sidebar placeholder (right) */}
      <aside
        id="workspace-ai-sidebar"
        className={cn(
          "fixed right-0 top-16 z-30 flex h-[calc(100vh-4rem)] w-80 flex-col border-l border-surface-border bg-surface/95 backdrop-blur-md transition-transform duration-300 ease-out",
          isAiPanelOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="AI assistant panel"
        aria-hidden={!isAiPanelOpen}
      >
        <div className="flex h-14 items-center gap-3 border-b border-surface-border px-4">
          <BotMessageSquare className="h-5 w-5 text-ai-text" />
          <span className="text-sm font-semibold text-copy-primary">
            AI Assistant
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-copy-muted">AI chat coming soon.</p>
        </div>
      </aside>

      {/* Dialogs */}
      <ProjectDialogs
        dialog={projectActions.dialog}
        selectedProject={projectActions.selectedProject}
        projectName={projectActions.projectName}
        slugPreview={projectActions.slugPreview}
        isLoading={projectActions.isLoading}
        onProjectNameChange={projectActions.setProjectName}
        onClose={projectActions.closeDialog}
        onCreateProject={projectActions.createProject}
        onRenameProject={projectActions.renameProject}
        onDeleteProject={projectActions.deleteProject}
      />

      {/* Share dialog */}
      <ShareDialog
        open={shareDialog.open}
        onOpenChange={shareDialog.setOpen}
        projectId={projectId}
        isOwner={isOwner}
        collaborators={shareDialog.collaborators}
        isFetching={shareDialog.isFetching}
        isLoading={shareDialog.isLoading}
        error={shareDialog.error}
        copied={shareDialog.copied}
        onInvite={shareDialog.invite}
        onRemove={shareDialog.remove}
        onCopyLink={shareDialog.copyLink}
      />
    </div>
  );
}
