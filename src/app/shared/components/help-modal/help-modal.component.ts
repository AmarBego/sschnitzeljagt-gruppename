import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import { IONIC_COMPONENTS } from '../../utils/ionic.utils';

@Component({
  selector: 'app-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ...IONIC_COMPONENTS],
})
export class HelpModalComponent {
  private modalController = inject(ModalController);

  constructor() {}

  dismiss() {
    this.modalController.dismiss();
  }
  statusInfo = [
    {
      icon: '⚪',
      color: '#ffffff',
      label: 'White outline',
      description: 'Unlocked & ready to start',
    },
    {
      icon: '⚫',
      color: '#666666',
      label: 'Dark outline',
      description: 'Locked (complete previous hunt first)',
    },
    {
      icon: '🟢',
      color: '#28a745',
      label: 'Green outline',
      description: 'Completed successfully',
    },
    {
      icon: '🟡',
      color: '#ffc107',
      label: 'Yellow outline',
      description: 'Skipped hunt',
    },
    {
      icon: '🔵',
      color: '#007bff',
      label: 'Blue outline',
      description: 'Late completion',
    },
  ];
}
