export class GitHubApiError extends Error {
  constructor(public status: number) {
    super(`GitHub API ${status}`);
  }
}

export async function fetchGist(gistId: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "gist.mom",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers,
  });
  if (!res.ok) throw new GitHubApiError(res.status);
  return res.json() as Promise<{
    id: string;
    files: Record<string, { filename: string; content: string }>;
    description: string | null;
    owner: { login: string } | null;
  }>;
}

export async function createGist(
  token: string,
  options: {
    filename?: string;
    content?: string;
    description?: string;
    public?: boolean;
  } = {}
) {
  const res = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "gist.mom",
    },
    body: JSON.stringify({
      description: options.description || "",
      public: options.public ?? false,
      files: {
        [options.filename || "untitled.md"]: {
          content: options.content || "# New Gist\n",
        },
      },
    }),
  });
  if (!res.ok) throw new GitHubApiError(res.status);
  return res.json() as Promise<{
    id: string;
    files: Record<string, { filename: string; content: string }>;
    description: string | null;
    owner: { login: string } | null;
  }>;
}

export type GistCommit = {
  version: string;
  user: { login: string } | null;
  committed_at: string;
  change_status: { total: number; additions: number; deletions: number };
};

export async function fetchGistCommits(
  gistId: string,
  token?: string
): Promise<GistCommit[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "gist.mom",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(
    `https://api.github.com/gists/${gistId}/commits`,
    { headers }
  );
  if (!res.ok) throw new GitHubApiError(res.status);
  return res.json() as Promise<GistCommit[]>;
}

export async function updateGist(
  gistId: string,
  filename: string,
  content: string,
  token: string
) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "gist.mom",
    },
    body: JSON.stringify({
      files: { [filename]: { content } },
    }),
  });
  if (!res.ok) throw new GitHubApiError(res.status);
  return res.json();
}
