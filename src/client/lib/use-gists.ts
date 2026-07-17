import { useState, useRef, useCallback } from "react";
import type { CreatedGist, GistSummary } from "../../shared/gists";

export async function createGist(isPublic: boolean): Promise<CreatedGist> {
  const res = await fetch("/api/gists", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public: isPublic }),
  });
  if (!res.ok) throw new Error(`Create failed: ${res.status}`);
  return res.json() as Promise<CreatedGist>;
}

export function useGists() {
  const [gists, setGists] = useState<GistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const loadSeqRef = useRef(0);

  const load = useCallback(() => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    setError(null);
    fetch("/api/gists", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<GistSummary[]>;
      })
      .then((data) => {
        if (seq === loadSeqRef.current) setGists(data);
      })
      .catch((e) => {
        if (seq === loadSeqRef.current) setError(String(e));
      })
      .finally(() => {
        if (seq === loadSeqRef.current) setLoading(false);
      });
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
