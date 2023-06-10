import type { CodegenConfig } from "@graphql-codegen/cli";

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      [process.env.NEXT_PUBLIC_API_URL]: {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY
        }
      }
    }
  ],
  documents: "app/forum/**/*.tsx",
  generates: {
    "app/forum/generated/": {
      preset: "client",
      plugins: []
    }
  }
};

export default config;
