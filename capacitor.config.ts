/// <reference types="@capacitor/status-bar" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Yapp',
  webDir: 'www',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#000000',
    },
  },
};

export default config;
