import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, GlobeIcon, LockIcon } from "@hugeicons/core-free-icons";
import { navigate } from "../lib/router";
import type { GistSummary } from "../lib/use-gists";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type CreateStatus = "idle" | "creating" | "failed";

export function NewGistMenu({ onCreated }: { onCreated?: () => void }) {
  const [status, setStatus] = useState<CreateStatus>("idle");
  const failedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(failedTimerRef.current), []);

  const createGist = async (isPublic: boolean) => {
    if (status === "creating") return;
    clearTimeout(failedTimerRef.current);
    setStatus("creating");
    try {
      const res = await fetch("/api/gists", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public: isPublic }),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      const gist = (await res.json()) as Pick<GistSummary, "id" | "owner">;
      setStatus("idle");
      onCreated?.();
      navigate(`/${gist.owner?.login ?? "unknown"}/${gist.id}`);
    } catch (e) {
      console.error("Create gist error:", e);
      setStatus("failed");
      failedTimerRef.current = setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={status === "failed" ? "destructive" : "secondary"}
          size="sm"
          aria-label="New gist"
          title={status === "failed" ? "Failed to create gist" : "New gist"}
          disabled={status === "creating"}
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => createGist(false)}>
          <HugeiconsIcon icon={LockIcon} size={16} />
          Secret gist
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => createGist(true)}>
          <HugeiconsIcon icon={GlobeIcon} size={16} />
          Public gist
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
