export type GistSummary = {
  id: string;
  description: string | null;
  owner: { login: string } | null;
  files: Record<string, { filename: string }>;
};

export type CreatedGist = GistSummary & { owner: { login: string } };
