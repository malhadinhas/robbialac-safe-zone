import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pt.learnsafe360.app',
  appName: 'LearnSafe360',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
