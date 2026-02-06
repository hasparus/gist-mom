import { betterAuth } from "better-auth";
import { D1Dialect } from "kysely-d1";

export function createAuth(env: Env) {
  return betterAuth({
    baseURL: env.AUTH_BASE_URL || "http://localhost:1999",
    basePath: "/api/auth",
    database: {
      dialect: new D1Dialect({ database: env.DATABASE }),
      type: "sqlite",
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        scope: ["gist"],
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
