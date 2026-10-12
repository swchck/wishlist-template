// @ts-check
import { readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

// Actions sets GITHUB_REPOSITORY, so a copy of the template deploys to its own
// Pages URL with no edits; SITE and BASE_PATH override it for a custom domain
const [owner = "", repo = ""] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const isUserSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;

// reservations of several wishlists can share one Supabase project; each site books under
// its own list id. An explicit listId survives a repo rename, the repo name is the fallback
const { listId, reservations = {} } = JSON.parse(readFileSync("./wishlist.config.json", "utf-8"));
const reservationsList = listId || process.env.GITHUB_REPOSITORY || "local";
// .env plus the process environment (Actions secrets); they win over the config so an
// existing secrets-based setup keeps working. The anon key is public by design either way
const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");

export default defineConfig({
  site:
    process.env.SITE ||
    (owner ? `https://${owner.toLowerCase()}.github.io` : undefined),
  base: process.env.BASE_PATH || (repo && !isUserSite ? `/${repo}` : "/"),
  trailingSlash: "ignore",
  vite: {
    define: {
      "import.meta.env.PUBLIC_WISHLIST_ID": JSON.stringify(reservationsList),
      "import.meta.env.PUBLIC_SUPABASE_URL": JSON.stringify(
        env.PUBLIC_SUPABASE_URL || reservations.url || "",
      ),
      "import.meta.env.PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(
        env.PUBLIC_SUPABASE_ANON_KEY || reservations.anonKey || "",
      ),
    },
  },
});
