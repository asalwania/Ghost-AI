import { dark } from "@clerk/ui/themes";
import type { Appearance } from "@clerk/ui";

const DEFAULT_SIGN_IN_PATH = "/sign-in";
const DEFAULT_SIGN_UP_PATH = "/sign-up";

function resolveRoutePath(envValue: string | undefined, fallbackPath: string) {
  if (!envValue) {
    return fallbackPath;
  }

  if (envValue.startsWith("/")) {
    return envValue;
  }

  try {
    return new URL(envValue).pathname || fallbackPath;
  } catch {
    return fallbackPath;
  }
}

export const clerkSignInUrl =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? DEFAULT_SIGN_IN_PATH;
export const clerkSignUpUrl =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? DEFAULT_SIGN_UP_PATH;

export const clerkSignInPath = resolveRoutePath(
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  DEFAULT_SIGN_IN_PATH
);
export const clerkSignUpPath = resolveRoutePath(
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  DEFAULT_SIGN_UP_PATH
);
export const editorPath = "/editor";
export const clerkPostAuthRedirectUrl = editorPath;

export const clerkAppearance: Appearance = {
  theme: dark,
  variables: {
    colorPrimary: "var(--accent-primary)",
    colorPrimaryForeground: "var(--brand-foreground)",
    colorForeground: "var(--text-primary)",
    colorMutedForeground: "var(--text-muted)",
    colorMuted: "var(--bg-subtle)",
    colorBackground: "var(--bg-surface)",
    colorInput: "var(--bg-subtle)",
    colorInputForeground: "var(--text-primary)",
    colorBorder: "var(--border-default)",
    colorNeutral: "var(--text-primary)",
    colorRing: "var(--accent-primary-dim)",
    colorDanger: "var(--state-error)",
    colorSuccess: "var(--state-success)",
    colorWarning: "var(--state-warning)",
    fontFamily: "var(--font-geist-sans), sans-serif",
    fontFamilyButtons: "var(--font-geist-sans), sans-serif",
    fontFamilyMono: "var(--font-geist-mono), monospace",
    borderRadius: "1rem",
  },
  options: {
    logoPlacement: "none",
    animations: true,
    elevation: "raised",
  },
  elements: {
    button: {
      color: "var(--text-primary)",
    },
    formButtonPrimary: {
      color: "var(--brand-foreground)",
      fontWeight: 600,
    },
    formButtonReset: {
      color: "var(--text-secondary)",
      fontWeight: 500,
    },
    socialButtonsBlockButton: {
      backgroundColor: "var(--bg-surface)",
      borderColor: "var(--border-default)",
      color: "var(--text-primary)",
      fontWeight: 500,
    },
    socialButtonsBlockButtonText: {
      color: "var(--text-primary)",
      fontWeight: 500,
    },
    socialButtonsProviderIcon: {
      color: "var(--text-primary)",
    },
    alternativeMethodsBlockButton: {
      color: "var(--text-primary)",
      fontWeight: 500,
    },
    alternativeMethodsBlockButtonText: {
      color: "var(--text-primary)",
      fontWeight: 500,
    },
    footerActionLink: {
      color: "var(--accent-primary)",
      fontWeight: 600,
    },
    userButtonPopoverCard: {
      backgroundColor: "var(--bg-surface)",
      borderColor: "var(--border-default)",
    },
    userButtonPopoverActionButton: {
      color: "var(--text-primary)",
      fontWeight: 500,
    },
    userButtonPopoverActionButtonIcon: {
      color: "var(--text-secondary)",
    },
    userButtonPopoverFooterPagesLink: {
      color: "var(--text-muted)",
    },
    navbarButton: {
      color: "var(--text-secondary)",
      fontWeight: 500,
    },
    navbarButton__active: {
      color: "var(--text-primary)",
    },
  },
};
