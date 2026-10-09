import type { NextConfig } from "next";

// basePath '/web-umkm' hanya digunakan saat deploy khusus ke GitHub Pages
const isGithubPages = process.env.DEPLOY_TARGET === "gh-pages";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? "/web-umkm" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

