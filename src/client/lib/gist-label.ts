import type { GistSummary } from "../../shared/gists";

export function gistLabel(g: GistSummary): string {
  if (g.description) return g.description;
  const files = Object.keys(g.files);
  if (files.length > 0) return files[0]!;
  return g.id.slice(0, 8);
}
