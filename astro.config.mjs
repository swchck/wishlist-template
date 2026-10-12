// @ts-check
import { readFileSync } from "node:fs";
import { defineConfig } from "astro/config";

// Actions sets GITHUB_REPOSITORY, so a copy of the template deploys to its own
// Pages URL with no edits; SITE and BASE_PATH override it for a custom domain
const [owner = "", repo = ""] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const isUserSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;

// reservations of several wishlists can share one Supabase project; each site books under
// its own list id. An explicit listId survives a repo rename, the repo name is the fallback
const { listId } = JSON.parse(readFileSync("./wishlist.config.json", "utf-8"));
const reservationsList = listId || process.env.GITHUB_REPOSITORY || "local";

export default defineConfig({
  site:
    process.env.SITE ||
    (owner ? `https://${owner.toLowerCase()}.github.io` : undefined),
  base: process.env.BASE_PATH || (repo && !isUserSite ? `/${repo}` : "/"),
  trailingSlash: "ignore",
  vite: {
    define: {
      "import.meta.env.PUBLIC_WISHLIST_ID": JSON.stringify(reservationsList),
    },
  },
});
