// Vercel Function: GitHub stars + latest release for the landing page.
// Cached at the edge for an hour so visitors never hit GitHub's 60 req/h anonymous limit.
// Optional: set GITHUB_TOKEN in Vercel to raise the server-side limit.

const REPO = "Jonorusc/limiar";

async function gh(path) {
  const headers = { accept: "application/vnd.github+json", "user-agent": "limiar-site" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 404) return null; // e.g. no releases yet
  if (!res.ok) throw new Error(`GitHub ${path} → ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  try {
    const [repo, release] = await Promise.all([
      gh(`/repos/${REPO}`),
      gh(`/repos/${REPO}/releases/latest`),
    ]);
    const dmg = release?.assets?.find((a) => a.name.endsWith(".dmg"));
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({
      stars: repo?.stargazers_count ?? 0,
      version: release?.tag_name?.replace(/^v/, "") ?? null,
      dmgUrl: dmg?.browser_download_url ?? null,
    });
  } catch (error) {
    // Short cache on failure so it recovers quickly.
    res.setHeader("Cache-Control", "public, s-maxage=60");
    res.status(502).json({ error: "github_unavailable" });
  }
}
