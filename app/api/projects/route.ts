import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PROJECT_NAME = "Untitled Project";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve the user's primary email for collaborator lookup.
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;

  const [ownedProjects, sharedProjects] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
    }),
    primaryEmail
      ? prisma.project.findMany({
          where: {
            collaborators: { some: { email: primaryEmail } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({ ownedProjects, sharedProjects });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name =
    body && typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : DEFAULT_PROJECT_NAME;

  const project = await prisma.project.create({
    data: { ownerId: userId, name },
  });

  return NextResponse.json({ project }, { status: 201 });
}
