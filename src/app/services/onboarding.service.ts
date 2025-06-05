import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { UserSetupAlertService } from './alerts/user-setup-alert.service';
import { PermissionService } from './permission.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly userService = inject(UserService);
  private readonly userSetupAlertService = inject(UserSetupAlertService);
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);

  async startOnboardingFlow(): Promise<void> {
    try {
      if (this.userService.isNewUser()) {
        await this.handleNewUser();
      } else {
        await this.handleExistingUser();
      }
    } catch (error) {
      console.error('Onboarding flow error:', error);
      await this.userSetupAlertService.showErrorAlert(
        'An error occurred during setup. Please try again.'
      );
    }
  }

  private async fetchPermissionStatus(
    permissionType: 'location' | 'camera'
  ): Promise<boolean> {
    if (permissionType === 'location') {
      return await this.permissionService.requestLocationPermission();
    } else {
      // 'camera'
      return await this.permissionService.requestCameraPermission();
    }
  }

  private async requestCriticalPermission(
    permissionType: 'location' | 'camera'
  ): Promise<boolean> {
    let granted = await this.fetchPermissionStatus(permissionType);
    const permissionName =
      permissionType.charAt(0).toUpperCase() + permissionType.slice(1);

    if (granted) {
      await this.userService.updateUserPermissions({ [permissionType]: true });
      return true;
    }

    // Permission not granted, show alert and ask to retry
    const retry = await this.userSetupAlertService.showPermissionDeniedAlert(
      permissionType,
      permissionName
    );

    if (retry) {
      granted = await this.fetchPermissionStatus(permissionType); // Try one more time
    }

    await this.userService.updateUserPermissions({ [permissionType]: granted });

    if (!granted) {
      console.warn(
        `${permissionName} permission was ultimately denied by the user after retry attempt or user chose not to retry.`
      );
    }
    return granted;
  }

  private async handleNewUser(): Promise<void> {
    const userName = await this.userSetupAlertService.showWelcomeAlert();
    if (!userName) {
      console.log(
        'User closed or cancelled the name input. Onboarding cannot proceed.'
      );
      return;
    }

    // Check if username is taken BEFORE proceeding with permissions
    const isTaken = await this.userService.isUsernameTaken(userName);
    if (isTaken) {
      await this.userSetupAlertService.showErrorAlert(
        'Username Taken',
        `The name "${userName}" is already in use. Please choose a different name.`
      );
      // Optionally, restart the name input or the onboarding flow
      // For now, we will just stop and let the user retry by restarting the app or flow.
      // this.startOnboardingFlow(); // This could cause a loop if not handled carefully
      return; // Stop onboarding for this attempt
    }

    // Request Camera Permission
    const cameraGranted = await this.requestCriticalPermission('camera');
    if (!cameraGranted) {
      await this.userSetupAlertService.showPermissionErrorAlert(
        'Camera',
        'Camera access is crucial for features like scanning QR codes. Please enable Camera permission in your app settings and restart the app to complete onboarding.'
      );
      return;
    }

    // Request Location Permission
    const locationGranted = await this.requestCriticalPermission('location');
    if (!locationGranted) {
      await this.userSetupAlertService.showPermissionErrorAlert(
        'Location',
        'Location access is essential for finding nearby activities. Please enable Location permission in your app settings and restart the app to complete onboarding.'
      );
      return;
    }

    // All critical steps passed. Create and save the user.
    const newUser: User = {
      name: userName,
      permissions: {
        location: locationGranted, // true
        camera: cameraGranted, // true
      },
      isSetupComplete: true,
      createdAt: new Date(),
    };

    // First, register the user in the global list
    await this.userService.registerUser(newUser);
    // Then, save the user as the current session user
    await this.userService.saveUser(newUser);
    await this.navigateToDashboard();
  }

  private async handleExistingUser(): Promise<void> {
    const user = this.userService.currentUser;
    if (!user) {
      await this.handleNewUser();
      return;
    }

    if (!user.isSetupComplete) {
      await this.handleNewUser();
      return;
    }

    await this.navigateToDashboard();
  }

  private async navigateToDashboard(): Promise<void> {
    await this.router.navigate(['/dashboard']);
  }
}
