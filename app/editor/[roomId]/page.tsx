import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { WorkspaceShell } from "@/components/editor/workspace-shell";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";
import { getProjectsForCurrentUser } from "@/lib/projects";
import { toEditorProject } from "@/lib/project-utils";

interface EditorWorkspacePageProps {
  params: Promise<{ roomId: string }>;
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const { roomId } = await params;

  // 1. Resolve the current user's identity.
  const identity = await getCurrentIdentity();
  if (!identity) {
    redirect("/sign-in");
  }

  // 2. Check project access (owner or collaborator).
  const project = await getProjectIfAccessible(roomId, identity);
  if (!project) {
    return <AccessDenied />;
  }

  // 3. Fetch all projects for the sidebar (same data shape as the home page).
  const projectData = await getProjectsForCurrentUser();
  const initialProjects = projectData
    ? [
        ...projectData.ownedProjects.map(toEditorProject),
        ...projectData.sharedProjects.map(toEditorProject),
      ]
    : [];

  const isOwner = project.ownerId === identity.userId;

  return (
    <WorkspaceShell
      projectId={project.id}
      projectName={project.name}
      isOwner={isOwner}
      initialProjects={initialProjects}
    />
  );
}

