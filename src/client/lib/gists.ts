import { createContext, useContext } from "react";
import type { CreatedGist, GistSummary } from "../../shared/gists";

export function gistLabel(g: GistSummary): string {
  if (g.description) return g.description;
  const files = Object.keys(g.files);
  if (files.length > 0) return files[0]!;
  return g.id.slice(0, 8);
}

export function gistHref(g: GistSummary): string {
  return `/${g.owner?.login ?? "unknown"}/${g.id}`;
}

export async function postGist(isPublic: boolean): Promise<CreatedGist> {
  const res = await fetch("/api/gists", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public: isPublic }),
  });
  if (!res.ok) throw new Error(`Create failed: ${res.status}`);
  return res.json() as Promise<CreatedGist>;
}

export type CreateStatus = "idle" | "creating" | "failed";

export type GistsContextValue = {
  gists: GistSummary[];
  loading: boolean;
  error: string | null;
  prefetch: () => void;
  refresh: () => void;
  create: (isPublic: boolean) => void;
  createStatus: CreateStatus;
};

export const GistsContext = createContext<GistsContextValue | null>(null);

export function useGists(): GistsContextValue {
  const ctx = useContext(GistsContext);
  if (!ctx) throw new Error("useGists must be used within GistsProvider");
  return ctx;
}
