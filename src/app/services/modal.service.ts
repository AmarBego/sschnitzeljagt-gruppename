import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { HelpModalComponent } from '../shared/components/help-modal/help-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  
  private readonly modalController = inject(ModalController);

  async showHelpModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: HelpModalComponent,
      cssClass: 'help-modal'
    });
    
    await modal.present();
  }

  async dismissModal(): Promise<void> {
    const modal = await this.modalController.getTop();
    if (modal) {
      await modal.dismiss();
    }
  }
}
