interface Env {
  ASSETS: Fetcher;
  GistRoom: DurableObjectNamespace;
  DATABASE: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  AUTH_BASE_URL?: string;
}
