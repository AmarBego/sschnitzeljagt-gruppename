// This service provides a generic way to show simple notification alerts, such as error messages.
import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class NotificationAlertService {
  private readonly alertController = inject(AlertController);

  async showErrorAlert(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Yapp',
      subHeader: 'Error',
      message,
      buttons: ['OK'],
    });

    await alert.present();
  }
}
