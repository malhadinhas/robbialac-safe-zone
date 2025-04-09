
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONGODB_URI: string;
  // outras variáveis de ambiente...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
