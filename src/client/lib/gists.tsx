import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { navigate } from "./router";
import { useTransientStatus } from "./use-transient-status";
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

async function postGist(isPublic: boolean): Promise<CreatedGist> {
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

type GistsContextValue = {
  gists: GistSummary[];
  loading: boolean;
  error: string | null;
  prefetch: () => void;
  refresh: () => void;
  create: (isPublic: boolean) => void;
  createStatus: CreateStatus;
};

const GistsContext = createContext<GistsContextValue | null>(null);

export function GistsProvider({ children }: { children: ReactNode }) {
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

  const {
    status: createStatus,
    set: setCreateStatus,
    setTransient: setCreateTransient,
  } = useTransientStatus<CreateStatus>("idle");

  const create = useCallback(
    async (isPublic: boolean) => {
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
    },
    [createStatus, refresh, setCreateStatus, setCreateTransient],
  );

  return (
    <GistsContext.Provider
      value={{ gists, loading, error, prefetch, refresh, create, createStatus }}
    >
      {children}
    </GistsContext.Provider>
  );
}

export function useGists(): GistsContextValue {
  const ctx = useContext(GistsContext);
  if (!ctx) throw new Error("useGists must be used within GistsProvider");
  return ctx;
}
