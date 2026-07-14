import { auth } from "@trigger.dev/sdk";
import { NextRequest, NextResponse } from "next/server";

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface TokenRequestBody {
  runId?: unknown;
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as TokenRequestBody | null;
  const runId = typeof body?.runId === "string" ? body.runId.trim() : "";

  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({ where: { runId } });

  if (!taskRun) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  if (taskRun.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await auth.createPublicToken({
    scopes: {
      read: {
        runs: [runId],
      },
    },
    expirationTime: "1h",
  });

  return NextResponse.json({ token }, { status: 200 });
}
