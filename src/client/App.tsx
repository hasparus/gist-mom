import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { parseRoute } from "./lib/router";
import { useSession } from "./lib/auth-client";
import { GistsProvider } from "./lib/gists-provider";
import { useTransientStatus } from "./lib/use-transient-status";
import { PresenceAvatars, type Peer } from "./components/PresenceAvatars";
import { Navbar } from "./components/Navbar";
import { CommandPalette } from "./components/CommandPalette";
import { EditorPage } from "./components/EditorPage";
import { GistSidebar } from "./components/GistSidebar";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";

import { Footer } from "./Footer";

function subscribeToPopstate(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

export default function App() {
  const pathname = useSyncExternalStore(
    subscribeToPopstate,
    () => window.location.pathname,
  );
  const route = parseRoute(pathname);
  const { data: session } = useSession();
  const [showPreview, setShowPreview] = useState(false);
  const {
    status: saveStatus,
    set: setSaveStatus,
    setTransient: setSaveTransient,
  } = useTransientStatus<"idle" | "saving" | "saved" | "failed">("idle");
  const [hasChanges, setHasChanges] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);
  const togglePreview = useCallback(() => setShowPreview((p) => !p), []);

  const handleCommit = useCallback(async () => {
    if (!session || saveStatus === "saving" || !hasChanges) return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/gists/${route.gistId}/commit`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 409) {
        setSaveStatus("idle");
        return;
      }
      if (!res.ok) throw new Error(`Commit failed: ${res.status}`);
      setHasChanges(false);
      setSaveTransient("saved", "idle");
    } catch (e) {
      console.error("Commit error:", e);
      setSaveTransient("failed", "idle");
    }
  }, [session, saveStatus, hasChanges, route.gistId, setSaveStatus, setSaveTransient]);

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
    <GistsProvider>
      <SidebarProvider defaultOpen={false}>
        <GistSidebar session={session} currentGistId={route.gistId} />
        <SidebarInset className="min-h-dvh">
          <Navbar
            session={session}
            user={route.user}
            gistId={route.gistId}
            onTogglePreview={togglePreview}
            onCommit={handleCommit}
            saveStatus={saveStatus}
            hasChanges={hasChanges}
          />
          <CommandPalette
            session={session}
            user={route.user}
            gistId={route.gistId}
            hasChanges={hasChanges}
            onCommit={handleCommit}
            onTogglePreview={togglePreview}
          />
          <EditorPage
            key={route.gistId}
            gistId={route.gistId}
            session={session}
            showPreview={showPreview}
            onCommit={handleCommit}
            onDirtyChange={setHasChanges}
            onPeersChange={setPeers}
          />
          <Footer>
            <PresenceAvatars peers={peers} />
          </Footer>
        </SidebarInset>
      </SidebarProvider>
    </GistsProvider>
  );
}
