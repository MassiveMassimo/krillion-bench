import type { NextConfig } from "next";

const config: NextConfig = {
  outputFileTracingExcludes: { "/*": ["./.local/**/*"] },
};

export default config;
