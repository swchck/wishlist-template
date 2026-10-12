import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { GIFT_TYPES } from "./lib/types";
import { config } from "./lib/config";

const items = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/items" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      type: z.enum(GIFT_TYPES).default("вещь"),
      category: z.string().optional(),
      price: z.number().nonnegative().optional(),
      currency: z.string().default(config.defaultCurrency),
      priority: z.number().int().min(1).max(5).default(3),
      deadline: z.coerce.date().optional(),
      url: z.string().url().optional(),
      links: z
        .array(z.object({ label: z.string(), url: z.string().url() }))
        .optional(),
      image: z
        .union([
          image(),
          z.string().url(),
          z.array(z.union([image(), z.string().url()])),
        ])
        .optional(),
      images: z.array(z.union([image(), z.string().url()])).optional(),
      description: z.string().optional(),
      hidden: z.boolean().default(false),
    }),
});

export const collections = { items };
