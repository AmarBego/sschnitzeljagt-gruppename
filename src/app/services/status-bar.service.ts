import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

@Injectable({
  providedIn: 'root',
})
export class StatusBarService {
  async configureStatusBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Hide the status bar to create a fullscreen experience
      await StatusBar.hide();

      console.log('Status bar configured for fullscreen');
    } catch (error) {
      console.error('Error configuring status bar:', error);
    }
  }

  async showStatusBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await StatusBar.show();
      console.log('Status bar shown');
    } catch (error) {
      console.error('Error showing status bar:', error);
    }
  }

  async hideStatusBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await StatusBar.hide();
      console.log('Status bar hidden');
    } catch (error) {
      console.error('Error hiding status bar:', error);
    }
  }

  async setStatusBarStyle(style: 'light' | 'dark'): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await StatusBar.setStyle({
        style: style === 'light' ? Style.Light : Style.Dark,
      });
      console.log(`Status bar style set to ${style}`);
    } catch (error) {
      console.error('Error setting status bar style:', error);
    }
  }
}
