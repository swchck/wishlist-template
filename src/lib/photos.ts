import type { ImageMetadata } from "astro";

type Img = ImageMetadata | string;

export function photosOf(data: { image?: Img | Img[]; images?: Img[] }): Img[] {
  const fromImage = Array.isArray(data.image)
    ? data.image
    : data.image
      ? [data.image]
      : [];
  return [...fromImage, ...(data.images ?? [])];
}
