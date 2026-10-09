import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS === "true" || process.env.DEPLOY_TARGET === "gh-pages";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? "/web-umkm" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

