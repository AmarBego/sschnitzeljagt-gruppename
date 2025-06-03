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

  // Add a flag to prevent multiple calls
  private isOnboardingInProgress = false;

  async startOnboardingFlow(): Promise<void> {
    // Prevent multiple simultaneous calls
    if (this.isOnboardingInProgress) {
      return;
    }

    this.isOnboardingInProgress = true;

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
    } finally {
      // Always reset the flag when done
      this.isOnboardingInProgress = false;
    }
  }

  private async handleNewUser(): Promise<void> {
    const userName = await this.userSetupAlertService.showWelcomeAlert();
    if (!userName) {
      // Don't recursively call startOnboardingFlow - just show error and return
      await this.userSetupAlertService.showErrorAlert(
        'Username is required. Please restart the app to try again.'
      );
      return;
    }

    const locationGranted = await this.requestPermissionStep('location');
    if (!locationGranted) {
      await this.userSetupAlertService.showErrorAlert(
        'Location permission is crucial for the app. Please enable it in settings and restart the app.'
      );
      return; // Don't recursively call startOnboardingFlow
    }

    const newUser: User = {
      name: userName,
      permissions: {
        location: locationGranted,
        camera: false,
      },
      isSetupComplete: true,
      createdAt: new Date(),
    };

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
      // Instead of calling handleNewUser, mark user as new and proceed with normal flow
      const updatedUser = { ...user, isSetupComplete: false };
      await this.userService.saveUser(updatedUser);
      await this.handleNewUser();
      return;
    }

    if (!user.permissions.location) {
      const locationGranted = await this.requestPermissionStep('location');
      if (!locationGranted) {
        console.info(
          'Location permission is not granted. Some features might be limited.'
        );
      }
    }

    await this.navigateToDashboard();
  }

  private async requestPermissionStep(
    permissionType: 'location'
  ): Promise<boolean> {
    const initialPermissionAccepted =
      await this.userSetupAlertService.showPermissionAlert();

    if (!initialPermissionAccepted) {
      await this.userService.updateUserPermissions({ [permissionType]: false });
      console.warn(
        `User declined initial prompt for ${permissionType} permission.`
      );
      return false;
    }

    let granted = false;
    if (permissionType === 'location') {
      granted = await this.permissionService.requestLocationPermission();
    }

    await this.userService.updateUserPermissions({ [permissionType]: granted });

    if (!granted) {
      const retry =
        await this.userSetupAlertService.showPermissionDeniedAlert();
      if (retry) {
        // Limit retry attempts to avoid infinite loop
        return await this.permissionService.requestLocationPermission();
      }
      console.warn(
        `${permissionType} permission denied and user chose not to retry.`
      );
      return false;
    }
    return true;
  }

  private async navigateToDashboard(): Promise<void> {
    await this.router.navigate(['/dashboard']);
  }
}
