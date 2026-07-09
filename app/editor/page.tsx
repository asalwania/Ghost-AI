import { redirect } from "next/navigation";

import { EditorHomeShell } from "@/components/editor/editor-home-shell";
import { getProjectsForCurrentUser } from "@/lib/projects";
import { toEditorProject } from "@/lib/project-utils";

export default async function EditorPage() {
  const data = await getProjectsForCurrentUser();

  // Redirect unauthenticated visitors — middleware handles most cases but this
  // is a safe fallback for any edge that slips through.
  if (!data) {
    redirect("/sign-in");
  }

  const initialProjects = [
    ...data.ownedProjects.map(toEditorProject),
    ...data.sharedProjects.map(toEditorProject),
  ];

  return <EditorHomeShell initialProjects={initialProjects} />;
}
