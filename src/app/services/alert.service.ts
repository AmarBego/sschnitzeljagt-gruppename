// This service acts as a facade for various types of alerts within the application.
// It delegates alert display logic to more specialized alert services.
import { Injectable, inject } from '@angular/core';
import { UserSetupAlertService } from './alerts/user-setup-alert.service';
import { HuntActionAlertService } from './alerts/hunt-action-alert.service';
import { NotificationAlertService } from './alerts/notification-alert.service';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private readonly userSetupAlerts = inject(UserSetupAlertService);
  private readonly huntActionAlerts = inject(HuntActionAlertService);
  private readonly notificationAlerts = inject(NotificationAlertService);

  async showPermissionDeniedAlert(
    permissionType: 'camera' | 'location',
    permissionName: string
  ): Promise<boolean> {
    return this.userSetupAlerts.showPermissionDeniedAlert(
      permissionType,
      permissionName
    );
  }

  // --- Hunt Action Alerts ---
  async showResetProgressAlert(): Promise<boolean> {
    return this.huntActionAlerts.showResetProgressAlert();
  }

  async showSkipHuntAlert(huntTitle: string): Promise<boolean> {
    return this.huntActionAlerts.showSkipHuntAlert(huntTitle);
  }

  // --- Notification Alerts ---
  async showErrorAlert(message: string): Promise<void> {
    return this.notificationAlerts.showErrorAlert(message);
  }
}
