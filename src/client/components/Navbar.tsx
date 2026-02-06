import { signIn } from "../lib/auth-client";
import { navigate } from "../lib/router";
import { GitHubIcon } from "./icons";
import type { Session } from "../lib/types";
import { UserProfileMenu } from "./UserProfileMenu";
import { Button } from "./ui/button";

export function Navbar({
  session,
  user,
  gistId,
  showPreview,
  onTogglePreview,
  onCommit,
  committing,
  hasChanges,
}: {
  session: Session;
  user: string;
  gistId: string;
  showPreview: boolean;
  onTogglePreview: () => void;
  onCommit: () => void;
  committing: boolean;
  hasChanges: boolean;
}) {
  return (
    <nav className="flex items-center gap-2 h-11 border-b border-border shrink-0">
      <div className="flex items-center gap-2 w-full max-w-4xl mx-auto px-3">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          className="font-bold text-base text-foreground no-underline hover:opacity-70 transition-opacity"
        >
          gist.mom
        </a>

        <span className="text-muted-foreground">/</span>

        <a
          href={`https://gist.github.com/${user}/${gistId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground truncate max-w-48 hover:text-foreground transition-colors no-underline"
        >
          {user}/{gistId.slice(0, 8)}
        </a>

        <div className="flex-1" />

        <Button
          variant={showPreview ? "secondary" : "ghost"}
          size="sm"
          onClick={onTogglePreview}
        >
          Preview
        </Button>

        {session ? (
          <>
            <span title={!hasChanges && !committing ? "No changes yet" : undefined}>
              <Button
                size="sm"
                onClick={onCommit}
                disabled={committing || !hasChanges}
              >
                {committing ? "Saving..." : "Save"}
              </Button>
            </span>
            <UserProfileMenu user={session.user} />
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => signIn.social({ provider: "github" })}
          >
            <GitHubIcon className="size-4" />
            Sign in with GitHub
          </Button>
        )}
      </div>
    </nav>
  );
}
