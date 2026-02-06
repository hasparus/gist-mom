import { useState, useEffect, useCallback } from "react";
import { parseRoute, type Route } from "./lib/router";
import { useSession } from "./lib/auth-client";
import { Navbar } from "./components/Navbar";
import { EditorPage } from "./components/EditorPage";
import { GistSidebar } from "./components/GistSidebar";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";

export default function App() {
  const [route, setRoute] = useState<Route>(() =>
    parseRoute(window.location.pathname)
  );
  const { data: session } = useSession();
  const [showPreview, setShowPreview] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleCommit = useCallback(async () => {
    if (!session || committing || !hasChanges) return;
    setCommitting(true);
    try {
      const res = await fetch(`/api/gists/${route.gistId}/commit`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 409) return; // no changes
      if (!res.ok) throw new Error(`Commit failed: ${res.status}`);
      setHasChanges(false);
    } catch (e) {
      console.error("Commit error:", e);
    } finally {
      setCommitting(false);
    }
  }, [session, committing, hasChanges, route.gistId]);

  // Global Ctrl+S / Cmd+S → commit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleCommit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCommit]);

  return (
    <SidebarProvider defaultOpen={false}>
      <GistSidebar session={session} currentGistId={route.gistId} />
      <SidebarInset className="h-dvh">
        <Navbar
          session={session}
          user={route.user}
          gistId={route.gistId}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview((p) => !p)}
          onCommit={handleCommit}
          committing={committing}
          hasChanges={hasChanges}
        />
        <EditorPage
          key={route.gistId}
          gistId={route.gistId}
          session={session}
          showPreview={showPreview}
          onCommit={handleCommit}
          onDirtyChange={setHasChanges}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
