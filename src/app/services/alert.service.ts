import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  
  private readonly alertController = inject(AlertController);

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
          },
          {
            text: 'Next',
            handler: (data) => {
              const name = data.userName?.trim();
              if (name) {
                resolve(name);
                return true;
              }
              return false; // Prevent closing if name is empty
            }
          }
        ],
        backdropDismiss: false
      });

      await alert.present();
    });
  }  async showPermissionAlert(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        subHeader: 'Permissions Required',
        cssClass: 'permission-alert',
        message: 'This app requires location permission to function properly. Your location data is used only for hunt activities and is not shared with third parties.',
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

  async showResetProgressAlert(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Reset Progress',
        message: 'This will reset your entire hunt progress and delete all current data. This action cannot be undone.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Reset',
            role: 'destructive',
            handler: () => resolve(true)
          }
        ],
        backdropDismiss: false
      });

      await alert.present();
    });
  }
  async showHelpAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Hunt Status Colors',
      message: `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong style="color: #ffffff;">⚪ White outline:</strong> Unlocked & ready to start</p>
          <p><strong style="color: #666666;">⚫ Dark outline:</strong> Locked (complete previous hunt first)</p>
          <p><strong style="color: #28a745;">🟢 Green outline:</strong> Completed successfully</p>
          <p><strong style="color: #fd7e14;">🟠 Orange outline:</strong> Skipped hunt</p>
          <p><strong style="color: #007bff;">🔵 Blue outline:</strong> Late completion</p>
          <p><strong style="color: #ffc107;">🟡 Yellow highlight:</strong> Currently active hunt</p>
        </div>
      `,
      buttons: ['OK']
    });

    await alert.present();
  }
}
