import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  EyeIcon,
  File01Icon,
  FloppyDiskIcon,
  GithubIcon,
  GlobeIcon,
  LockIcon,
  SidebarLeftIcon,
} from "@hugeicons/core-free-icons";
import { navigate } from "../lib/router";
import { gistHref, gistLabel, useGists } from "../lib/gists";
import type { Session } from "../lib/types";
import { useSidebar } from "./ui/sidebar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "./ui/command";

export function CommandPalette({
  session,
  user,
  gistId,
  hasChanges,
  onCommit,
  onTogglePreview,
}: {
  session: Session;
  user: string;
  gistId: string;
  hasChanges: boolean;
  onCommit: () => void;
  onTogglePreview: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { gists, prefetch, create } = useGists();
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open && session) prefetch();
  }, [open, session, prefetch]);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search your gists..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {session && (
          <CommandGroup heading="Gists">
            <CommandItem onSelect={run(() => create(false))}>
              <HugeiconsIcon icon={LockIcon} />
              New secret gist
            </CommandItem>
            <CommandItem onSelect={run(() => create(true))}>
              <HugeiconsIcon icon={GlobeIcon} />
              New public gist
            </CommandItem>
          </CommandGroup>
        )}
        <CommandGroup heading="Editor">
          {session && (
            <CommandItem disabled={!hasChanges} onSelect={run(onCommit)}>
              <HugeiconsIcon icon={FloppyDiskIcon} />
              Save to GitHub
              <CommandShortcut>&#8984;S</CommandShortcut>
            </CommandItem>
          )}
          <CommandItem onSelect={run(onTogglePreview)}>
            <HugeiconsIcon icon={EyeIcon} />
            Toggle preview
          </CommandItem>
          {session && (
            <CommandItem onSelect={run(toggleSidebar)}>
              <HugeiconsIcon icon={SidebarLeftIcon} />
              Toggle sidebar
              <CommandShortcut>&#8984;B</CommandShortcut>
            </CommandItem>
          )}
        </CommandGroup>
        <CommandGroup heading="Go">
          <CommandItem
            onSelect={run(() =>
              window.open(
                `https://gist.github.com/${user}/${gistId}`,
                "_blank",
                "noopener,noreferrer",
              ),
            )}
          >
            <HugeiconsIcon icon={GithubIcon} />
            Open gist on GitHub
          </CommandItem>
          <CommandItem
            onSelect={run(() =>
              navigator.clipboard.writeText(window.location.href),
            )}
          >
            <HugeiconsIcon icon={Copy01Icon} />
            Copy link to gist
          </CommandItem>
        </CommandGroup>
        {session && gists.length > 0 && (
          <CommandGroup heading="Your gists">
            {gists.map((g) => (
              <CommandItem
                key={g.id}
                value={`${gistLabel(g)} ${g.id}`}
                onSelect={run(() => navigate(gistHref(g)))}
              >
                <HugeiconsIcon icon={File01Icon} />
                {gistLabel(g)}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
