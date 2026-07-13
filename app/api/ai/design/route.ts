import { tasks } from "@trigger.dev/sdk";
import { NextRequest, NextResponse } from "next/server";

import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { designAgentTask } from "@/trigger/design-agent";

interface DesignRequestBody {
  prompt?: unknown;
  roomId?: unknown;
  projectId?: unknown;
}

export async function POST(request: NextRequest) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as DesignRequestBody | null;

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const roomId = typeof body?.roomId === "string" ? body.roomId.trim() : "";
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }
  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  if (roomId !== projectId) {
    return NextResponse.json(
      { error: "roomId must match projectId" },
      { status: 400 }
    );
  }

  const project = await getProjectIfAccessible(projectId, identity);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
    prompt,
    roomId,
    projectName: project.name,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId,
      userId: identity.userId,
    },
  });

  return NextResponse.json({ runId: handle.id }, { status: 201 });
}
