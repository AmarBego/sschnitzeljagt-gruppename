import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  async requestLocationPermission(): Promise<boolean> {
    return Capacitor.isNativePlatform()
      ? this.requestNativeLocationPermission()
      : this.requestWebLocationPermission();
  }

  async checkLocationPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      return this.checkNativeLocationPermission();
    }

    if (!navigator.permissions) return false;

    try {
      const result = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });
      return result.state === 'granted';
    } catch {
      return false;
    }
  }
  private async requestNativeLocationPermission(): Promise<boolean> {
    try {
      // First check current permission status
      const currentPermissions = await Geolocation.checkPermissions();

      if (currentPermissions.location === 'granted') {
        return true;
      }

      // Request permissions
      const permissions = await Geolocation.requestPermissions();
      const isGranted = permissions.location === 'granted';

      if (!isGranted) {
        console.log('Location permission denied by user');
      }

      return isGranted;
    } catch (error) {
      console.error('Error requesting native location permission:', error);
      return false;
    }
  }

  private async checkNativeLocationPermission(): Promise<boolean> {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error checking native location permission:', error);
      return false;
    }
  }

  private async requestWebLocationPermission(): Promise<boolean> {
    if (!navigator.geolocation) return false;

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        {
          timeout: 5000,
          enableHighAccuracy: false,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }
}
