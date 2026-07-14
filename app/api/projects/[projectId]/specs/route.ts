import { NextRequest, NextResponse } from "next/server";

import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getProjectIfAccessible(projectId, identity);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const specs = await prisma.projectSpec.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ specs });
  } catch (error) {
    console.error("Specs list failed", error);
    return NextResponse.json(
      { error: "Failed to list specs" },
      { status: 500 }
    );
  }
}
