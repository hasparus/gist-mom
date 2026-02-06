import { Suspense, use } from "react";
import { GitHubIcon } from "./components/icons";

export function Footer({ children }: { children: React.ReactNode }) {
  return (
    <footer className="flex min-h-11 shrink-0 items-center justify-center border-t border-border text-xs text-muted-foreground">
      <div className="flex items-center gap-2 w-full max-w-4xl mx-auto px-3 py-1.5 flex-wrap">
      {children}
      <span className="flex items-center gap-x-2 gap-y-0.5 ml-auto flex-wrap justify-start sm:justify-end">
        <span>
          built by{" "}
          <a
            href="https://x.com/hasparus"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/30 hover:text-foreground hover:decoration-foreground/50"
          >
            @hasparus
          </a>{" "}
          with{" "}
          <a
            href="https://yjs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/30 hover:text-foreground hover:decoration-foreground/50"
          >
            Y-
          </a>
          <a
            href="https://github.com/threepointone/partyserver"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/30 hover:text-foreground hover:decoration-foreground/50"
          >
            PartyServer
          </a>{" "}
          🎈 on{" "}
          <a
            href="https://workers.cloudflare.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/30 hover:text-foreground hover:decoration-foreground/50"
          >
            Cloudflare
          </a>{" "}
          ☁️
        </span>
        <span className="max-sm:hidden">•</span>
        <a
          href="https://github.com/hasparus/gist-mom"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline decoration-muted-foreground/30 hover:text-foreground hover:decoration-foreground/50"
        >
          <Suspense>
            <StarCount />
          </Suspense>
          stars on GitHub
          <GitHubIcon className="size-3.5" />
        </a>
      </span>
      </div>
    </footer>
  );
}

const starsPromise = fetch("https://api.github.com/repos/hasparus/gist-mom")
  .then((r) => r.json())
  .then(
    (d: unknown) =>
      (d as { stargazers_count?: number }).stargazers_count ?? null,
  )
  .catch(() => null);

function StarCount() {
  const stars = use(starsPromise);
  if (stars === null) return <span>?</span>;
  return <span>{stars}</span>;
}
