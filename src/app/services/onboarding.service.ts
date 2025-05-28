import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { AlertService } from './alert.service';
import { PermissionService } from './permission.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  
  private readonly userService = inject(UserService);
  private readonly alertService = inject(AlertService);
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
      await this.alertService.showErrorAlert('An error occurred during setup. Please try again.');
    }
  }
  private async handleNewUser(): Promise<void> {
    const userName = await this.alertService.showWelcomeAlert();
    if (!userName) {
      await this.startOnboardingFlow();
      return;
    }

    const permissionAccepted = await this.alertService.showPermissionAlert();
    if (!permissionAccepted) {
      await this.startOnboardingFlow();
      return;
    }

    const locationGranted = await this.permissionService.requestLocationPermission();
    
    if (!locationGranted) {
      const retry = await this.alertService.showPermissionDeniedAlert();
      if (retry) {
        await this.handleNewUser();
      }
      return;
    }

    const newUser: User = {
      name: userName,
      permissions: {
        location: locationGranted,
        camera: false
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
      await this.handleNewUser();
      return;
    }

    const hasLocationPermission = await this.permissionService.checkLocationPermission();
    if (!hasLocationPermission) {
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
