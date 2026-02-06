import { useState } from "react";
import { signOut } from "../lib/auth-client";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { GitHubIcon } from "./icons";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type User = {
  name: string;
  image?: string | null;
};

function UserAvatar({ user, size = 28 }: { user: User; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const showImage = user.image && !imgError;

  return (
    <div
      className="rounded-full border border-border overflow-hidden flex items-center justify-center shrink-0 select-none bg-muted text-muted-foreground"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        fontWeight: 600,
      }}
    >
      {showImage ? (
        <img
          src={user.image!}
          alt={user.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        user.name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

export function UserProfileMenu({ user }: { user: User }) {
  const username = user.name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full size-8">
          <UserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon className="size-4" />
            <span className="flex-1">GitHub profile</span>
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} className="text-muted-foreground" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`https://gist.github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon className="size-4" />
            <span className="flex-1">Your gists</span>
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} className="text-muted-foreground" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
          <HugeiconsIcon icon={Logout01Icon} size={16} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
