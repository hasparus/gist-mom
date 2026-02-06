import { useState } from "react";
import { signOut } from "../lib/auth-client";
import { ExternalLink, LogOut } from "lucide-react";
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
        <Button variant="ghost" size="sm" className="gap-1.5">
          <UserAvatar user={user} />
          <span className="hidden sm:inline">{username}</span>
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
            <ExternalLink className="size-3 text-muted-foreground" />
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
            <ExternalLink className="size-3 text-muted-foreground" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
