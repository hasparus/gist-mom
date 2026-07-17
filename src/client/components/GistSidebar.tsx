import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon } from "@hugeicons/core-free-icons";
import { navigate } from "../lib/router";
import { gistHref, gistLabel, useGists } from "../lib/gists";
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
  SidebarTrigger,
} from "./ui/sidebar";

export function GistSidebar({
  session,
  currentGistId,
}: {
  session: Session;
  currentGistId: string;
}) {
  const { gists, loading, error } = useGists();
  if (!session) return null;

  return (
    <Sidebar variant="floating" collapsible="offcanvas">
      <SidebarHeader className="px-3 pt-3 flex-row items-center justify-between">
        <span className="text-sm font-medium text-sidebar-foreground">
          Your Gists
        </span>
        <SidebarTrigger />
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
                  const isActive = g.id === currentGistId;
                  return (
                    <SidebarMenuItem key={g.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={gistLabel(g)}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(gistHref(g));
                        }}
                      >
                        <HugeiconsIcon icon={File01Icon} size={16} className="shrink-0" />
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
