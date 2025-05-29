import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { AlertService } from './alert.service';
import { PermissionService } from './permission.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  
  constructor(
    private userService: UserService,
    private alertService: AlertService,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  async startOnboardingFlow(): Promise<void> {
    try {
      // Step 1: Check if user exists
      if (this.userService.isNewUser()) {
        await this.handleNewUser();
      } else {
        await this.handleExistingUser();
      }
    } catch (error) {
      console.error('Onboarding flow error:', error);
      await this.alertService.showErrorAlert('An error occurred during setup. Please try again.');
    }
  }

  private async handleNewUser(): Promise<void> {
    // Step 1: Get user name
    const userName = await this.alertService.showWelcomeAlert();
    if (!userName) {
      // User cancelled, restart flow
      await this.startOnboardingFlow();
      return;
    }

    // Step 2: Show permissions alert
    const permissionAccepted = await this.alertService.showPermissionAlert();
    if (!permissionAccepted) {
      // User cancelled, restart flow
      await this.startOnboardingFlow();
      return;
    }

    // Step 3: Request actual permissions
    const locationGranted = await this.permissionService.requestLocationPermission();
    
    if (!locationGranted) {
      // Permission denied, show retry alert
      const retry = await this.alertService.showPermissionDeniedAlert();
      if (retry) {
        await this.handleNewUser(); // Restart from name entry
      }
      return;
    }

    // Step 4: Save user and complete setup
    const newUser: User = {
      name: userName,
      permissions: {
        location: locationGranted,
        camera: false // Will be requested when needed
      },
      isSetupComplete: true,
      createdAt: new Date()
    };

    await this.userService.saveUser(newUser);
    await this.navigateToDashboard();
  }

  private async handleExistingUser(): Promise<void> {
    const user = this.userService.currentUser;
    if (!user?.isSetupComplete) {
      // User exists but setup wasn't completed
      await this.handleNewUser();
      return;
    }

    // Check if location permission is still valid
    const hasLocationPermission = await this.permissionService.checkLocationPermission();
    if (!hasLocationPermission) {
      // Permission was revoked, request again
      const permissionAccepted = await this.alertService.showPermissionAlert();
      if (permissionAccepted) {
        const locationGranted = await this.permissionService.requestLocationPermission();
        await this.userService.updateUserPermissions({ location: locationGranted });
        
        if (!locationGranted) {
          const retry = await this.alertService.showPermissionDeniedAlert();
          if (retry) {
            await this.handleExistingUser();
          }
          return;
        }
      } else {
        await this.handleExistingUser();
        return;
      }
    }

    await this.navigateToDashboard();
  }

  private async navigateToDashboard(): Promise<void> {
    await this.router.navigate(['/dashboard']);
  }
}
