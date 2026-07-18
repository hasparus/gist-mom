import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, GlobeIcon, LockIcon } from "@hugeicons/core-free-icons";
import { useGists } from "../lib/gists";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function NewGistMenu() {
  const { create, createStatus } = useGists();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={createStatus === "failed" ? "destructive" : "secondary"}
          size="sm"
          aria-label="New gist"
          title={
            createStatus === "failed" ? "Failed to create gist" : "New gist"
          }
          disabled={createStatus === "creating"}
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
