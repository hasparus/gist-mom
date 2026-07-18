import { useRef, useState, type ReactNode } from "react";
import { navigate } from "./router";
import { useTransientStatus } from "./use-transient-status";
import { GistsContext, postGist, type CreateStatus } from "./gists";
import type { GistSummary } from "../../shared/gists";

export function GistsProvider({ children }: { children: ReactNode }) {
  const [gists, setGists] = useState<GistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const loadSeqRef = useRef(0);

  const load = () => {
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
  };

  const prefetch = () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    load();
  };

  const refresh = () => {
    fetchedRef.current = true;
    load();
  };

  const {
    status: createStatus,
    set: setCreateStatus,
    setTransient: setCreateTransient,
  } = useTransientStatus<CreateStatus>("idle");

  const create = async (isPublic: boolean) => {
    if (createStatus === "creating") return;
    setCreateStatus("creating");
    try {
      const gist = await postGist(isPublic);
      setCreateStatus("idle");
      refresh();
      navigate(`/${gist.owner.login}/${gist.id}`);
    } catch (e) {
      console.error("Create gist error:", e);
      setCreateTransient("failed", "idle");
    }
  };

  return (
    <GistsContext.Provider
      value={{ gists, loading, error, prefetch, refresh, create, createStatus }}
    >
      {children}
    </GistsContext.Provider>
  );
}
