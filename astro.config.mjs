// @ts-check
import { defineConfig } from "astro/config";

// Actions sets GITHUB_REPOSITORY, so a copy of the template deploys to its own
// Pages URL with no edits; SITE and BASE_PATH override it for a custom domain
const [owner = "", repo = ""] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const isUserSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;

export default defineConfig({
  site:
    process.env.SITE ||
    (owner ? `https://${owner.toLowerCase()}.github.io` : undefined),
  base: process.env.BASE_PATH || (repo && !isUserSite ? `/${repo}` : "/"),
  trailingSlash: "ignore",
});
