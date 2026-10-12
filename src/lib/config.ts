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
  /** Reservations namespace in a shared Supabase project; "owner/repo" by convention. */
  listId: z.string().min(1).max(140).optional(),
  /** Supabase project for reservations; the PUBLIC_SUPABASE_* secrets take precedence. */
  reservations: z
    .object({ url: z.string().url(), anonKey: z.string().min(1) })
    .optional(),
});

export const config = WishlistConfig.parse(raw);
