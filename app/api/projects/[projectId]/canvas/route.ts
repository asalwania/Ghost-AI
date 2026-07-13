import { get, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

import { parseCanvasSnapshot } from "@/lib/canvas-snapshot";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function canvasPath(projectId: string) {
  return `canvas/${projectId}.json`;
}

async function getAccessibleCanvasProject(projectId: string) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const project = await getProjectIfAccessible(projectId, identity);
  if (!project) {
    return {
      error: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return { project };
}

async function readBlobJson(url: string): Promise<unknown> {
  const blob = await get(url, { access: "private", useCache: false });

  if (!blob || blob.statusCode === 304 || !blob.stream) {
    return null;
  }

  return new Response(blob.stream).json();
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { error } = await getAccessibleCanvasProject(projectId);

  if (error) {
    return error;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project?.canvasJsonPath) {
    return NextResponse.json({ canvas: null });
  }

  try {
    const rawCanvas = await readBlobJson(project.canvasJsonPath);
    const canvas = parseCanvasSnapshot(rawCanvas);

    if (!canvas) {
      return NextResponse.json(
        { error: "Saved canvas is invalid" },
        { status: 500 }
      );
    }

    return NextResponse.json({ canvas });
  } catch (error) {
    console.error("Canvas load failed", error);
    return NextResponse.json(
      { error: "Canvas load failed" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { error } = await getAccessibleCanvasProject(projectId);

  if (error) {
    return error;
  }

  const body = await request.json().catch(() => null);
  const canvas = parseCanvasSnapshot(body);

  if (!canvas) {
    return NextResponse.json({ error: "Invalid canvas" }, { status: 400 });
  }

  try {
    const blob = await put(canvasPath(projectId), JSON.stringify(canvas), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json",
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });

    return NextResponse.json({ canvasUrl: blob.url });
  } catch (error) {
    console.error("Canvas save failed", error);
    return NextResponse.json(
      { error: "Canvas save failed" },
      { status: 500 }
    );
  }
}
