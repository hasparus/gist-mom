import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, GlobeIcon, LockIcon } from "@hugeicons/core-free-icons";
import { navigate } from "../lib/router";
import { createGist } from "../lib/use-gists";
import { useTransientStatus } from "../lib/use-transient-status";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type CreateStatus = "idle" | "creating" | "failed";

export function NewGistMenu({ onCreated }: { onCreated: () => void }) {
  const { status, set, setTransient } =
    useTransientStatus<CreateStatus>("idle");

  const create = async (isPublic: boolean) => {
    if (status === "creating") return;
    set("creating");
    try {
      const gist = await createGist(isPublic);
      set("idle");
      onCreated();
      navigate(`/${gist.owner.login}/${gist.id}`);
    } catch (e) {
      console.error("Create gist error:", e);
      setTransient("failed", "idle");
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
        <DropdownMenuItem onClick={() => create(false)}>
          <HugeiconsIcon icon={LockIcon} size={16} />
          Secret gist
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => create(true)}>
          <HugeiconsIcon icon={GlobeIcon} size={16} />
          Public gist
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
