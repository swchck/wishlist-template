import { z } from "astro/zod";
import raw from "../../wishlist.config.json";

/** Bumped on any change to the item frontmatter that older editors would mangle. */
export const SCHEMA_VERSION = 1;

const WishlistConfig = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  title: z.string().min(1),
  defaultCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default("RUB"),
});

export const config = WishlistConfig.parse(raw);
