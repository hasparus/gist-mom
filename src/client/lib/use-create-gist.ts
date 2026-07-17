import { navigate } from "./router";
import { createGist } from "./use-gists";
import { useTransientStatus } from "./use-transient-status";

type CreateStatus = "idle" | "creating" | "failed";

export function useCreateGist(onCreated: () => void) {
  const { status, set, setTransient } =
    useTransientStatus<CreateStatus>("idle");

  const create = async (isPublic: boolean) => {
    if (status === "creating") return;
    set("creating");
    try {
      const gist = await createGist(isPublic);
      set("idle");
      onCreated();
      navigate(`/${gist.owner.login}/${gist.id}`);
    } catch (e) {
      console.error("Create gist error:", e);
      setTransient("failed", "idle");
    }
  };

  return { status, create };
}
