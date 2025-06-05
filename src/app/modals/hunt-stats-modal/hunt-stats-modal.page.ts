import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Hunt } from '../../models/hunt.model';

@Component({
  selector: 'app-hunt-stats-modal',
  templateUrl: './hunt-stats-modal.page.html',
  styleUrls: ['./hunt-stats-modal.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class HuntStatsModalPage implements OnInit {
  @Input() allHunts: Hunt[] = [];

  completedHunts: Hunt[] = [];

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.completedHunts = this.allHunts.filter(hunt => hunt.isCompleted);
  }

  getHuntDisplayStatus(hunt: Hunt): string {
    if (hunt.isSkipped) {
      return 'Skipped';
    }
    if (hunt.isLateCompletion) {
      return 'Completed (Late)';
    }
    return 'Completed';
  }

  formatDuration(seconds?: number): string {
    if (seconds === undefined || seconds === null) {
      return 'N/A'; // Not Applicable if duration is not set (e.g. for some skipped scenarios before duration was recorded)
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
