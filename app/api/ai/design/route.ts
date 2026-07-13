import { tasks } from "@trigger.dev/sdk";
import { NextRequest, NextResponse } from "next/server";

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { designAgentTask } from "@/trigger/design-agent";

interface DesignRequestBody {
  prompt?: unknown;
  roomId?: unknown;
  projectId?: unknown;
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
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

  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
    prompt,
    roomId,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId,
      userId,
    },
  });

  return NextResponse.json({ runId: handle.id }, { status: 201 });
}
