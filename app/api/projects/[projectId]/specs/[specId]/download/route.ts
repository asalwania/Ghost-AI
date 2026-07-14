import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const { projectId, specId } = await params;

  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getProjectIfAccessible(projectId, identity);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const projectSpec = await prisma.projectSpec.findUnique({
    where: { id: specId },
  });

  if (!projectSpec || projectSpec.projectId !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const blob = await get(projectSpec.filePath, {
      access: "private",
      useCache: false,
    });

    if (!blob || !blob.stream) {
      return NextResponse.json(
        { error: "Spec file not found" },
        { status: 404 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    headers.set(
      "Content-Disposition",
      `attachment; filename="spec-${projectSpec.id}.md"`
    );

    return new Response(blob.stream, { headers });
  } catch (error) {
    console.error("Spec download failed", error);
    return NextResponse.json(
      { error: "Spec download failed" },
      { status: 500 }
    );
  }
}
