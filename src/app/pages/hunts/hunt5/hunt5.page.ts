import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_COMPONENTS } from '../../../shared/utils/ionic.utils';
import { AnimatedActionButtonComponent } from '../../../shared/components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../../../shared/components/hunt-timer/hunt-timer.component';
import { HuntPageHelper } from '../../../shared/utils/hunt-page.helper';
import { BaseHuntPage } from '../../../shared/utils/base-hunt.page';
import { Device } from '@capacitor/device';
@Component({
  selector: 'app-hunt5',
  templateUrl: './hunt5.page.html',
  styleUrls: ['./hunt5.page.scss'],
  standalone: true,
  imports: [
    ...IONIC_COMPONENTS,
    CommonModule,
    FormsModule,
    AnimatedActionButtonComponent,
    HuntTimerComponent,
  ],
  providers: [HuntPageHelper],
})
export class Hunt5Page extends BaseHuntPage implements OnInit, OnDestroy {
  override get huntId(): number {
    return 5;
  }

  charging: boolean | undefined = false;
  private batteryCheckIntervalId?: number;

  override ngOnInit(): void {
    super.ngOnInit();
    this.startChargingCheck();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopChargingCheck();
  }

  private async checkChargingStatus() {
    const info = await Device.getBatteryInfo();
    this.charging = info.isCharging;
    console.log('Lädt gerade:', this.charging);
  }

  private startChargingCheck() {
    this.batteryCheckIntervalId = window.setInterval(() => {
      this.checkChargingStatus();
    }, 1000);
  }

  private stopChargingCheck() {
    if (this.batteryCheckIntervalId !== undefined) {
      clearInterval(this.batteryCheckIntervalId);
      this.batteryCheckIntervalId = undefined;
    }
  }
}
