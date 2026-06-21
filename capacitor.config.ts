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
    // Point at the FINAL host. gitakids.com 308-redirects to www.gitakids.com;
    // loading the apex made Capacitor treat the off-host redirect as an external
    // link and bounce the user out to Chrome. Allow both hosts so all in-site
    // navigation (and any redirect) stays inside the app WebView.
    url: 'https://www.gitakids.com',
    allowNavigation: ['gitakids.com', 'www.gitakids.com', '*.gitakids.com'],
  },
  android: {
    backgroundColor: '#FDF6E3',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#FDF6E3',
      launchAutoHide: false, // the site's app-mode script hides it once loaded
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
