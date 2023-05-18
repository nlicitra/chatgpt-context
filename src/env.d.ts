/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly OPEN_AI_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
