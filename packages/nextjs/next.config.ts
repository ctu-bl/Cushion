import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // Workaround for ethers v5 ESM path picked by some helpers (@aave)
    // Redirect lib.esm to CJS build which exists in all installs
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@ethersproject/strings/lib.esm/index.js": require.resolve("@ethersproject/strings/lib/index.js"),
      "@ethersproject/bytes/lib.esm/index.js": require.resolve("@ethersproject/bytes/lib/index.js"),
    };
    return config;
  },
};

const isIpfs = process.env.NEXT_PUBLIC_IPFS_BUILD === "true";

if (isIpfs) {
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
  nextConfig.images = {
    unoptimized: true,
  };
}

module.exports = nextConfig;
