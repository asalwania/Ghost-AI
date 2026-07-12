import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { editorPath, clerkSignInPath } from "@/lib/clerk";

export default async function Home() {
  const { isAuthenticated, sessionStatus } = await auth();

  redirect(
    isAuthenticated && sessionStatus === "active" ? editorPath : clerkSignInPath
  );
}
