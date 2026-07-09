"use client";

import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="relative min-h-screen overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="min-h-screen px-4 pt-20 pb-4 sm:px-6">
        <section className="flex min-h-[calc(100vh-6rem)] items-center justify-center rounded-3xl border border-surface-border bg-surface/50 px-6 py-10 shadow-[inset_0_1px_0_var(--border-subtle)] backdrop-blur-sm">
          <div className="max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copy-muted">
              Editor canvas
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-copy-primary sm:text-4xl">
              The base chrome is in place.
            </h1>
            <p className="mt-4 text-base leading-7 text-copy-secondary">
              This shell frames the editor canvas with a fixed navbar and a floating
              project sidebar, ready for the later chapter features.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
