import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  
  constructor(private alertController: AlertController) {}

  async showWelcomeAlert(): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        subHeader: 'Welcome to Yapp!',
        message: 'New user detected. Please enter your name to get started.',
        inputs: [
          {
            name: 'userName',
            type: 'text',
            placeholder: 'Enter your name',
            attributes: {
              maxlength: 50,
              required: true
            }
          }
        ],
        buttons: [
          {
            text: 'Close',
            role: 'cancel',
            handler: () => resolve(null)
          },          {
            text: 'Next',
            handler: (data) => {
              if (data.userName?.trim()) {
                resolve(data.userName.trim());
                return true;
              } else {
                return false; // Prevent closing if name is empty
              }
            }
          }
        ],
        backdropDismiss: false
      });

      await alert.present();
    });
  }
  async showPermissionAlert(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        subHeader: 'Permissions Required',
        cssClass: 'permission-alert',
        message: `
        woww
        `,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Grant Permissions',
            handler: () => resolve(true)
          }
        ],
        backdropDismiss: false
      });

      await alert.present();
    });
  }

  async showPermissionDeniedAlert(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Yapp',
        subHeader: 'Permissions Required',
        message: 'Location permission is required to use this app. Please grant permission to continue.',
        buttons: [
          {
            text: 'Exit',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Try Again',
            handler: () => resolve(true)
          }
        ],
        backdropDismiss: false
      });

      await alert.present();
    });
  }

  async showErrorAlert(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Yapp',
      subHeader: 'Error',
      message,
      buttons: ['OK']
    });

    await alert.present();
  }
}
