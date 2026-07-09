import { NextRequest, NextResponse } from "next/server";

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function loadOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  if (project.ownerId !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { project };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { error } = await loadOwnedProject(projectId, userId);
  if (error) {
    return error;
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name },
  });

  return NextResponse.json({ project });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { error } = await loadOwnedProject(projectId, userId);
  if (error) {
    return error;
  }

  await prisma.project.delete({ where: { id: projectId } });

  return NextResponse.json({ success: true });
}
