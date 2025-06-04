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
        () => resolve(false),
        {
          timeout: 5000,
          enableHighAccuracy: false,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  private async requestWebCameraPermission(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Camera API not available in this browser.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the tracks to release the camera
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Error requesting web camera permission:', error);
      return false;
    }
  }
}
