import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  async requestLocationPermission(): Promise<boolean> {
    return Capacitor.isNativePlatform()
      ? this.requestNativeLocationPermission()
      : this.requestWebLocationPermission();
  }

  async requestCameraPermission(): Promise<boolean> {
    return Capacitor.isNativePlatform()
      ? this.requestNativeCameraPermission()
      : this.requestWebCameraPermission();
  }

  private async requestNativeCameraPermission(): Promise<boolean> {
    try {
      const currentPermissions = await Camera.checkPermissions();

      if (currentPermissions.camera === 'granted') {
        return true;
      }

      const permissions = await Camera.requestPermissions();
      const isGranted = permissions.camera === 'granted';

      if (!isGranted) {
        console.log('Camera permission denied by user');
      }

      return isGranted;
    } catch (error) {
      console.error('Error checking native camera permission:', error);
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
        (error: GeolocationPositionError) => {
          // Check if running on a web platform
          if (!Capacitor.isNativePlatform()) {
            if (error.code === error.PERMISSION_DENIED) {
              console.warn(
                'Web location permission explicitly denied by user.'
              );
              resolve(false); // User explicitly denied
            } else {
              console.warn(
                `Debug Bypass: Web location acquisition failed (Code: ${error.code}, Message: ${error.message}). Bypassing for debugging on web.`
              );
              resolve(true); // Bypass other errors (e.g., position unavailable, timeout) for web
            }
          } else {
            // On native platforms, any error should be treated as a failure.
            resolve(false);
          }
        },
        {
          timeout: 10000, // 10 seconds
          enableHighAccuracy: false,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  private async requestWebCameraPermission(): Promise<boolean> {
    try {
      // Check if mediaDevices and getUserMedia are available
      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        console.warn(
          'Camera API not available in this browser or environment.'
        );
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the tracks to release the camera
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        console.warn(
          'Debug Bypass: Web camera permission request failed because no camera was found (NotFoundError). Bypassing for debugging purposes.'
        );
        return true;
      }
      console.error('Error requesting web camera permission:', error);
      return false;
    }
  }
}
