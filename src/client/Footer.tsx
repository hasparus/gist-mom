import { Suspense, use } from "react";
import { GitHubIcon } from "./components/icons";

export function Footer({ children }: { children: React.ReactNode }) {
  return (
    <footer className="flex h-11 shrink-0 items-center justify-center gap-2 border-t border-border px-2 text-xs text-muted-foreground">
      {children}
      <span className="flex items-center gap-2 ml-auto">
        <span>
          built by{" "}
          <a
            href="https://x.com/hasparus"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            @hasparus
          </a>{" "}
          with{" "}
          <a
            href="https://yjs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            Y.js
          </a>
          ,{" "}
          <a
            href="https://github.com/threepointone/partyserver"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            PartyServer
          </a>{" "}
          🎈 and{" "}
          <a
            href="https://www.cloudflare.com/developer-platform/products/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            Cloudflare
          </a>{" "}
          ☁️
        </span>
        <span>&middot;</span>
        <a
          href="https://github.com/hasparus/gist-mom"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <Suspense>
            <StarCount />
          </Suspense>
          stars on GitHub
          <GitHubIcon className="size-3.5" />
        </a>
      </span>
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
