import { SignIn } from "@clerk/nextjs";

import { ClerkAuthStatus } from "@/components/auth/clerk-auth-status";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  clerkAppearance,
  clerkPostAuthRedirectUrl,
  clerkSignInPath,
  clerkSignUpUrl,
} from "@/lib/clerk";

const authPoints = [
  {
    title: "AI Architecture Generation",
    description:
      "Describe your system in plain English and map it onto a live canvas.",
  },
  {
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export default function SignInPage() {
  return (
    <AuthShell
      title="Design systems at the speed of thought."
      description="Describe your architecture in plain English. Ghost AI maps it to a shared canvas your whole team can refine in real time."
      points={authPoints}
    >
      <ClerkAuthStatus>
        <SignIn
          appearance={clerkAppearance}
          fallbackRedirectUrl={clerkPostAuthRedirectUrl}
          forceRedirectUrl={clerkPostAuthRedirectUrl}
          path={clerkSignInPath}
          routing="path"
          signUpFallbackRedirectUrl={clerkPostAuthRedirectUrl}
          signUpForceRedirectUrl={clerkPostAuthRedirectUrl}
          signUpUrl={clerkSignUpUrl}
        />
      </ClerkAuthStatus>
    </AuthShell>
  );
}
