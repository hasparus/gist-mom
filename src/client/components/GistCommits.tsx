import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { GitCommitIcon } from "@hugeicons/core-free-icons";
import { timeAgo } from "../lib/utils";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type GistCommit = {
  version: string;
  user: { login: string } | null;
  committed_at: string;
  change_status: { total: number; additions: number; deletions: number };
};

export function GistCommits({
  user,
  gistId,
}: {
  user: string;
  gistId: string;
}) {
  const [commits, setCommits] = useState<GistCommit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCommits() {
    if (commits) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gists/${gistId}/commits`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setCommits(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover onOpenChange={(open) => open && fetchCommits()}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          aria-label="Revisions"
        >
          <HugeiconsIcon
            icon={GitCommitIcon}
            size={16}
            className="rotate-90 text-muted-foreground"
          />
          <span className="max-sm:hidden">
            {commits?.length ?? ""} Revisions
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[calc(100vw-16px)] sm:w-80 p-0 max-sm:translate-x-2"
      >
        <div className="px-3 pt-1 pb-1.5 border-b border-border">
          <a
            href={`https://gist.github.com/${user}/${gistId}/revisions`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm sm:text-xs font-medium hover:underline no-underline text-muted-foreground"
          >
            Commit History
          </a>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {loading && (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">
              Loading...
            </p>
          )}
          {error && (
            <p className="px-3 py-4 text-xs text-destructive text-center">
              {error}
            </p>
          )}
          {commits && commits.length === 0 && (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">
              No commits yet
            </p>
          )}
          {commits?.map((c) => (
            <a
              key={c.version}
              href={`https://gist.github.com/${user}/${gistId}/${c.version}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-3 sm:py-2 text-sm hover:bg-accent no-underline text-foreground transition-colors hover:duration-0"
            >
              <code className="text-sm sm:text-xs">
                {c.version.slice(0, 7)}
              </code>
              <code className="text-sm sm:text-xs text-muted-foreground">
                {c.user?.login}
              </code>
              <span className="flex items-center gap-2 text-sm sm:text-xs text-muted-foreground ml-auto">
                {(c.change_status.additions > 0 ||
                  c.change_status.deletions > 0) && (
                  <span>
                    {c.change_status.additions > 0 && (
                      <span className="text-green-600 dark:text-green-400">
                        +{c.change_status.additions}
                      </span>
                    )}
                    {c.change_status.additions > 0 &&
                      c.change_status.deletions > 0 &&
                      " "}
                    {c.change_status.deletions > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        -{c.change_status.deletions}
                      </span>
                    )}
                  </span>
                )}
                {timeAgo(c.committed_at)}
              </span>
            </a>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
