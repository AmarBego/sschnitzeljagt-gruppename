import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  
  async requestLocationPermission(): Promise<boolean> {
    return Capacitor.isNativePlatform() 
      ? this.requestWebLocationPermission() // Will be enhanced for native later
      : this.requestWebLocationPermission();
  }

  async checkLocationPermission(): Promise<boolean> {
    if (!navigator.permissions) return false;

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return result.state === 'granted';
    } catch {
      return false;
    }
  }

  private async requestWebLocationPermission(): Promise<boolean> {
    if (!navigator.geolocation) return false;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { 
          timeout: 5000,
          enableHighAccuracy: false,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }
}
