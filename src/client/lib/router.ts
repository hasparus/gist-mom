const MANIFESTO_USER = "hasparus";
const MANIFESTO_GIST_ID = "a8390723cd893a21db00beba580fca36";

export type Route = { type: "editor"; user: string; gistId: string };

export function parseRoute(pathname: string): Route {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 2) {
    return { type: "editor", user: parts[0]!, gistId: parts[1]! };
  }
  // / → manifesto gist
  return { type: "editor", user: MANIFESTO_USER, gistId: MANIFESTO_GIST_ID };
}

export function navigate(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
