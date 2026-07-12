import { NextRequest, NextResponse } from "next/server";

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// DELETE /api/projects/[projectId]/collaborators/[email]
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; email: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail).toLowerCase();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const record = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
  });

  if (!record) {
    return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
  }

  await prisma.projectCollaborator.delete({
    where: { projectId_email: { projectId, email } },
  });

  return NextResponse.json({ success: true });
}
