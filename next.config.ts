import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // src/db/*.ts uses .js-suffixed relative imports (required for the worker
  // scripts to run directly under tsx/node ESM resolution). Next.js's
  // webpack bundler doesn't map those to .ts files by default, so alias it.
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ...(webpackConfig.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js"],
    };
    return webpackConfig;
  },
};
export default config;
