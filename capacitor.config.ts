import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gitakids.app',
  appName: 'Gita Kids',
  webDir: 'www',
  // Phase 1: Remote WebView. The app loads the live site, so every image and
  // verse change appears with no app rebuild. The bundled `www/` shell is only
  // a fallback shown if the site is unreachable.
  // When images + content are finalized, switch to a bundled build (drop
  // `server.url`, point `webDir` at the Astro `dist/`).
  server: {
    url: 'https://gitakids.com',
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#FDF6E3',
  },
};

export default config;
