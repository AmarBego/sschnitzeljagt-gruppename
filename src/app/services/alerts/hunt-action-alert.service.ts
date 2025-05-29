// This service handles alerts that confirm user actions related to hunts, such as resetting progress or skipping a hunt.
import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class HuntActionAlertService {
  private readonly alertController = inject(AlertController);

  async showResetProgressAlert(): Promise<boolean> {
    return new Promise(async resolve => {
      const alert = await this.alertController.create({
        header: 'Reset Progress',
        message:
          'This will reset your entire hunt progress and delete all current data. This action cannot be undone.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(false),
          },
          {
            text: 'Reset',
            role: 'destructive',
            handler: () => resolve(true),
          },
        ],
        backdropDismiss: false,
      });

      await alert.present();
    });
  }

  async showSkipHuntAlert(huntTitle: string): Promise<boolean> {
    return new Promise(async resolve => {
      const alert = await this.alertController.create({
        header: 'Skip Hunt',
        message: `Are you sure you want to skip "${huntTitle}"? You can still unlock the next hunt, but this one will be marked as skipped.`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(false),
          },
          {
            text: 'Skip',
            role: 'destructive',
            handler: () => resolve(true),
          },
        ],
        backdropDismiss: false,
      });

      await alert.present();
    });
  }
}
