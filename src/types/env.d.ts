
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONGODB_URI: string;
  readonly VITE_MONGODB_DB_NAME: string;
  readonly VITE_CF_ACCOUNT_ID: string;
  readonly VITE_CF_ACCESS_KEY_ID: string;
  readonly VITE_CF_SECRET_ACCESS_KEY: string;
  readonly VITE_CF_BUCKET_NAME: string;
  readonly VITE_CF_PUBLIC_URL: string;
  // outras variáveis de ambiente...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
