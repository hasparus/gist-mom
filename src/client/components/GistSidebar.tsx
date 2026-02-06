import { useState, useEffect } from "react";
import { FileTextIcon } from "lucide-react";
import { navigate } from "../lib/router";
import type { Session } from "../lib/types";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
} from "./ui/sidebar";

type GistSummary = {
  id: string;
  description: string | null;
  owner: { login: string } | null;
  files: Record<string, { filename: string }>;
  updated_at: string;
};

function gistLabel(g: GistSummary): string {
  if (g.description) return g.description;
  const files = Object.keys(g.files);
  if (files.length > 0) return files[0]!;
  return g.id.slice(0, 8);
}

export function GistSidebar({
  session,
  currentGistId,
}: {
  session: Session;
  currentGistId: string;
}) {
  const [gists, setGists] = useState<GistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setGists([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch("/api/gists", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<GistSummary[]>;
      })
      .then(setGists)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) return null;

  return (
    <Sidebar variant="floating" collapsible="offcanvas">
      <SidebarHeader className="px-3 pt-3">
        <span className="text-sm font-medium text-sidebar-foreground">
          Your Gists
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {loading ? (
              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : error ? (
              <p className="px-2 text-xs text-muted-foreground">
                Failed to load gists
              </p>
            ) : gists.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground">
                No gists yet
              </p>
            ) : (
              <SidebarMenu>
                {gists.map((g) => {
                  const owner = g.owner?.login ?? "unknown";
                  const isActive = g.id === currentGistId;
                  return (
                    <SidebarMenuItem key={g.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={gistLabel(g)}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/${owner}/${g.id}`);
                        }}
                      >
                        <FileTextIcon className="size-4 shrink-0" />
                        <span className="truncate">{gistLabel(g)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
