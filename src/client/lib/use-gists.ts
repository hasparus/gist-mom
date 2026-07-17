import { useState, useRef, useCallback } from "react";

export type GistSummary = {
  id: string;
  description: string | null;
  owner: { login: string } | null;
  files: Record<string, { filename: string }>;
  updated_at: string;
};

export function useGists() {
  const [gists, setGists] = useState<GistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/gists", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<GistSummary[]>;
      })
      .then(setGists)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const prefetch = useCallback(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    load();
  }, [load]);

  const refresh = useCallback(() => {
    fetchedRef.current = true;
    load();
  }, [load]);

  return { gists, loading, error, prefetch, refresh };
}
