import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_COMPONENTS } from '../../../shared/utils/ionic.utils';
import { AnimatedActionButtonComponent } from '../../../shared/components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../../../shared/components/hunt-timer/hunt-timer.component';
import { HuntPageHelper } from '../../../shared/utils/hunt-page.helper';
import { BaseHuntPage } from '../../../shared/utils/base-hunt.page';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
  private previousChargingState: boolean | undefined = undefined;

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
    const newChargingState = info.isCharging;

    // Check if charging state changed and provide haptic feedback
    if (
      this.previousChargingState !== undefined &&
      this.previousChargingState !== newChargingState
    ) {
      if (newChargingState) {
        // Device started charging - positive feedback
        await Haptics.impact({ style: ImpactStyle.Medium });
        console.log('Device plugged in - haptic feedback triggered');
      } else {
        // Device stopped charging - light feedback
        await Haptics.impact({ style: ImpactStyle.Light });
        console.log('Device unplugged - haptic feedback triggered');
      }
    }

    this.previousChargingState = this.charging;
    this.charging = newChargingState;
    console.log('Lädt gerade:', this.charging);
  }

  private async startChargingCheck() {
    // Initial haptic feedback when starting monitoring
    await Haptics.impact({ style: ImpactStyle.Light });
    console.log('Started charging monitoring - haptic feedback triggered');

    this.batteryCheckIntervalId = window.setInterval(() => {
      this.checkChargingStatus();
    }, 1000);
  }

  private async stopChargingCheck() {
    if (this.batteryCheckIntervalId !== undefined) {
      clearInterval(this.batteryCheckIntervalId);
      this.batteryCheckIntervalId = undefined;

      // Haptic feedback when stopping monitoring
      await Haptics.impact({ style: ImpactStyle.Light });
      console.log('Stopped charging monitoring - haptic feedback triggered');
    }
  }
}
