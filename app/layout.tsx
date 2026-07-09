import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  clerkAppearance,
  clerkPostAuthRedirectUrl,
  clerkSignInUrl,
  clerkSignUpUrl,
} from "@/lib/clerk";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ghost AI",
    template: "%s | Ghost AI",
  },
  description: "Ghost AI collaborative system design workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-base font-sans text-copy-primary antialiased">
        <ClerkProvider
          appearance={clerkAppearance}
          signInFallbackRedirectUrl={clerkPostAuthRedirectUrl}
          signInForceRedirectUrl={clerkPostAuthRedirectUrl}
          signInUrl={clerkSignInUrl}
          signUpFallbackRedirectUrl={clerkPostAuthRedirectUrl}
          signUpForceRedirectUrl={clerkPostAuthRedirectUrl}
          signUpUrl={clerkSignUpUrl}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
