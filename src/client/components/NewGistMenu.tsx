import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, GlobeIcon, LockIcon } from "@hugeicons/core-free-icons";
import { navigate } from "../lib/router";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type CreateStatus = "idle" | "creating" | "failed";

export function NewGistMenu() {
  const [status, setStatus] = useState<CreateStatus>("idle");

  const createGist = async (isPublic: boolean) => {
    if (status === "creating") return;
    setStatus("creating");
    try {
      const res = await fetch("/api/gists", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public: isPublic }),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      const gist = (await res.json()) as {
        id: string;
        owner: { login: string } | null;
      };
      setStatus("idle");
      navigate(`/${gist.owner?.login ?? "anonymous"}/${gist.id}`);
    } catch (e) {
      console.error("Create gist error:", e);
      setStatus("failed");
      setTimeout(() => setStatus("idle"), 2000);
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
