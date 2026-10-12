// BASE_URL is "/" for a <user>.github.io repo and "/<repo>" otherwise, so naive
// `${base}/x` concatenation yields "//x" — a protocol-relative URL to host "x"
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

/** Returns a root-relative path for `path` under the deployment base. */
export function withBase(path = ""): string {
  return `${BASE}/${path.replace(/^\/+/, "")}`;
}
