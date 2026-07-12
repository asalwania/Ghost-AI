import { auth } from "@clerk/nextjs/server";

export async function getAuthUserId() {
  const { isAuthenticated, userId } = await auth();
  return isAuthenticated ? userId : null;
}
