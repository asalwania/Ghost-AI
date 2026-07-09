import { clerkClient } from "@clerk/nextjs/server";

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface ProjectData {
  id: string;
  name: string;
  updatedAt: Date;
  ownership: "owned" | "shared";
}

/**
 * Fetches owned and shared projects for the currently authenticated user.
 * Returns null if the user is not authenticated.
 */
export async function getProjectsForCurrentUser(): Promise<{
  ownedProjects: ProjectData[];
  sharedProjects: ProjectData[];
} | null> {
  const userId = await getAuthUserId();
  if (!userId) {
    return null;
  }

  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;

  const [owned, shared] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    primaryEmail
      ? prisma.project.findMany({
          where: {
            collaborators: { some: { email: primaryEmail } },
          },
          select: { id: true, name: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return {
    ownedProjects: owned.map((p) => ({ ...p, ownership: "owned" as const })),
    sharedProjects: shared.map((p) => ({
      ...p,
      ownership: "shared" as const,
    })),
  };
}
