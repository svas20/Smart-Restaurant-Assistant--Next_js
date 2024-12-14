import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages:['faiss-node'],
  webpack: (config, { isServer }) => {
    // Only enable WebAssembly support on the client side
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true, // Enable WebAssembly support for the client

      };

      // Add a rule to handle .wasm files on the client side
      config.module.rules.push({
        test: /\.wasm$/,
        type: "webassembly/async",
      });
    }

    return config;
  },
};

export default nextConfig;
