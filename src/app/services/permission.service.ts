import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  
  async requestLocationPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      // For native platforms, we'll add proper geolocation permissions later
      return this.requestWebLocationPermission();
    } else {
      return this.requestWebLocationPermission();
    }
  }

  private async requestWebLocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 5000 }
      );
    });
  }

  async checkLocationPermission(): Promise<boolean> {
    if (!navigator.permissions) {
      return false;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return result.state === 'granted';
    } catch {
      return false;
    }
  }
}
