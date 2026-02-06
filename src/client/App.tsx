import { useState, useEffect, useCallback } from "react";
import { parseRoute, type Route } from "./lib/router";
import { useSession } from "./lib/auth-client";
import { useGists } from "./lib/use-gists";
import { PresenceAvatars, type Peer } from "./components/PresenceAvatars";
import { Navbar } from "./components/Navbar";
import { EditorPage } from "./components/EditorPage";
import { GistSidebar } from "./components/GistSidebar";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";

import { Footer } from "./Footer";

export default function App() {
  const [route, setRoute] = useState<Route>(() =>
    parseRoute(window.location.pathname),
  );
  const { data: session } = useSession();
  const {
    gists,
    loading: gistsLoading,
    error: gistsError,
    prefetch: prefetchGists,
  } = useGists();
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");
  const [hasChanges, setHasChanges] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      console.error("Commit error:", e);
      setSaveStatus("failed");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  }, [session, saveStatus, hasChanges, route.gistId]);

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
      <GistSidebar
        session={session}
        currentGistId={route.gistId}
        gists={gists}
        loading={gistsLoading}
        error={gistsError}
      />
      <SidebarInset className="h-dvh">
        <Navbar
          session={session}
          user={route.user}
          gistId={route.gistId}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview((p) => !p)}
          onCommit={handleCommit}
          saveStatus={saveStatus}
          hasChanges={hasChanges}
          onPrefetchGists={prefetchGists}
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
  );
}
