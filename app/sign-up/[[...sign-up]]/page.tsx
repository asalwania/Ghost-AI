import { SignUp } from "@clerk/nextjs";

import { ClerkAuthStatus } from "@/components/auth/clerk-auth-status";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  clerkAppearance,
  clerkPostAuthRedirectUrl,
  clerkSignInUrl,
  clerkSignUpPath,
} from "@/lib/clerk";

const authPoints = [
  {
    title: "Create a workspace",
    description: "Set up your first Ghost AI project in seconds.",
  },
  {
    title: "Collaborate together",
    description: "Invite teammates into the same shared architecture room.",
  },
  {
    title: "Ship the spec",
    description: "Turn the final graph into a persistent Markdown specification.",
  },
];

export default function SignUpPage() {
  return (
    <AuthShell
      title="Start your next system design."
      description="Create a Ghost AI account to build collaborative architecture rooms and export polished technical specs."
      points={authPoints}
    >
      <ClerkAuthStatus>
        <SignUp
          appearance={clerkAppearance}
          fallbackRedirectUrl={clerkPostAuthRedirectUrl}
          forceRedirectUrl={clerkPostAuthRedirectUrl}
          signInFallbackRedirectUrl={clerkPostAuthRedirectUrl}
          signInForceRedirectUrl={clerkPostAuthRedirectUrl}
          path={clerkSignUpPath}
          routing="path"
          signInUrl={clerkSignInUrl}
        />
      </ClerkAuthStatus>
    </AuthShell>
  );
}
