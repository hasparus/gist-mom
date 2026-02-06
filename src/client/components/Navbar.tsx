import { signIn } from "../lib/auth-client";
import { navigate } from "../lib/router";
import { GistCommits } from "./GistCommits";
import { GitHubIcon } from "./icons";
import type { Session } from "../lib/types";
import { UserProfileMenu } from "./UserProfileMenu";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";

type SaveStatus = "idle" | "saving" | "saved" | "failed";

export function Navbar({
  session,
  user,
  gistId,
  showPreview,
  onTogglePreview,
  onCommit,
  saveStatus,
  hasChanges,
  onPrefetchGists,
}: {
  session: Session;
  user: string;
  gistId: string;
  showPreview: boolean;
  onTogglePreview: () => void;
  onCommit: () => void;
  saveStatus: SaveStatus;
  hasChanges: boolean;
  onPrefetchGists?: () => void;
}) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex items-center h-11 border-b border-border shrink-0"
    >
      {session && (
        <div className="shrink-0 pl-2" onMouseEnter={onPrefetchGists}>
          <SidebarTrigger />
        </div>
      )}
      <div className="flex items-center gap-1.5 w-full max-w-4xl mx-auto px-2">
        <div className="flex items-center gap-1">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            className="font-medium text-sm text-foreground no-underline hover:opacity-70 transition-opacity"
          >
            gist.mom
          </a>
          <span className="text-muted-foreground text-xs">:</span>

          <a
            href={`https://gist.github.com/${user}/${gistId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground truncate max-w-48 hover:text-foreground hover:underline transition-colors no-underline"
          >
            {user}/{gistId.slice(0, 8)}
          </a>
        </div>

        <div className="flex-1" />

        <GistCommits user={user} gistId={gistId} />

        <Button variant="secondary" size="sm" onClick={onTogglePreview}>
          Preview
        </Button>

        {session ? (
          <>
            <span
              title={
                !hasChanges && saveStatus === "idle"
                  ? "No changes yet"
                  : undefined
              }
            >
              <Button
                size="sm"
                variant={saveStatus === "failed" ? "destructive" : "default"}
                onClick={onCommit}
                disabled={
                  saveStatus === "saving" ||
                  saveStatus === "saved" ||
                  !hasChanges
                }
              >
                {saveStatus === "saving"
                  ? "Saving\u2026"
                  : saveStatus === "saved"
                    ? "Saved \u2713"
                    : saveStatus === "failed"
                      ? "Failed"
                      : "Save"}
              </Button>
            </span>
            <UserProfileMenu user={session.user} />
          </>
        ) : (
          <Button
            size="sm"
            onClick={() => signIn.social({ provider: "github" })}
          >
            <GitHubIcon className="size-4" />
            Sign in
          </Button>
        )}
      </div>
      {/* Spacer to balance the sidebar trigger so the center bar stays centered */}
      {session && (
        <div className="shrink-0 pl-2">
          <div className="size-7" />
        </div>
      )}
    </nav>
  );
}
