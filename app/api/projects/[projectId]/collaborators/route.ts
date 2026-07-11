import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { getAuthUserId } from "@/lib/auth";
import { getCurrentIdentity, getProjectIfAccessible } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CollaboratorEntry {
  email: string;
  displayName: string | null;
  imageUrl: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve display name + avatar for a list of emails via Clerk's user list. */
async function enrichCollaborators(
  emails: string[]
): Promise<CollaboratorEntry[]> {
  if (emails.length === 0) return [];

  const clerk = await clerkClient();
  const { data: clerkUsers } = await clerk.users.getUserList({
    emailAddress: emails,
    limit: 100,
  });

  // Build a lookup: primary email → Clerk user data
  const byEmail = new Map(
    clerkUsers.flatMap((u) =>
      u.emailAddresses.map((e) => [
        e.emailAddress,
        {
          displayName:
            [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
            u.username ||
            null,
          imageUrl: u.imageUrl ?? null,
        },
      ])
    )
  );

  return emails.map((email) => {
    const clerk = byEmail.get(email);
    return {
      email,
      displayName: clerk?.displayName ?? null,
      imageUrl: clerk?.imageUrl ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/collaborators
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await getProjectIfAccessible(projectId, identity);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const records = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { email: true },
  });

  const emails = records.map((r) => r.email);
  const collaborators = await enrichCollaborators(emails);

  return NextResponse.json({ collaborators });
}

// ---------------------------------------------------------------------------
// POST /api/projects/[projectId]/collaborators
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
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

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Check for self-invite
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const ownerEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;
  if (ownerEmail && ownerEmail.toLowerCase() === email) {
    return NextResponse.json(
      { error: "You cannot invite yourself" },
      { status: 400 }
    );
  }

  try {
    await prisma.projectCollaborator.create({
      data: { projectId, email },
    });
  } catch {
    // Unique constraint violation → already a collaborator
    return NextResponse.json(
      { error: "Already a collaborator" },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
