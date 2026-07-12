import { FileText, Network, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  description: string;
  points: Array<{
    title: string;
    description: string;
  }>;
  children: ReactNode;
}

export function AuthShell({
  title,
  description,
  points,
  children,
}: AuthShellProps) {
  return (
    <main className="h-dvh w-full overflow-hidden bg-base text-copy-primary">
      <div className="flex h-full min-h-0 w-full">
        <section className="relative hidden h-full min-h-0 flex-1 overflow-hidden border-r border-surface-border bg-surface md:flex">
          {/* <div className="absolute inset-y-0 left-0 w-16 bg-brand-dim" /> */}
          <div className="absolute inset-y-0 left-0 w-px bg-brand/80" />
          <div className="absolute inset-y-0 right-0 w-px bg-surface-border" />

          <div className="relative z-10 flex h-full min-h-0 w-full flex-col px-8 py-8 xl:px-12 xl:py-10">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand" />
              <p className="text-base font-semibold text-copy-primary">
                Ghost AI
              </p>
            </div>

            <div className="flex flex-1 flex-col gap-4 justify-center pb-8 pt-16 xl:pt-24">
              <div className="max-w-xl space-y-5">
                <p style={{fontSize: "2.2rem"}} className="max-w-[12ch] text-4xl font-semibold leading-tight text-copy-primary xl:text-5xl">
                  {title}
                </p>
                <p className="max-w-lg text-xs leading-8 text-copy-secondary">
                  {description}
                </p>
              </div>

              <ul className="mt-14 space-y-6">
                {points.map((point, index) => (
                  <li
                    key={point.title}
                    className="flex items-start gap-4 text-sm text-copy-secondary"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-elevated text-brand">
                      {index === 0 ? (
                        <Sparkles className="h-4 w-4" />
                      ) : index === 1 ? (
                        <Network className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </span>
                    <span className="max-w-lg">
                      <span className="mb-1 block text-base font-medium text-copy-primary">
                        {point.title}
                      </span>
                      <span className="block text-sm leading-6 text-copy-secondary">
                        {point.description}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="pt-8 text-sm text-copy-faint">
              (c) 2026 Ghost AI. All rights reserved.
            </p>
          </div>
        </section>

        <section className="flex h-full min-h-0 flex-1 items-center justify-center overflow-hidden bg-base px-6 py-8 sm:px-8 lg:px-12">
          <div className="flex justify-center w-full rounded-3xl border border-surface-border bg-elevated/95 p-4 shadow-[0_32px_120px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6">
            <div className="max-w-[540px] rounded-[1.5rem] bg-surface/20 p-1">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
