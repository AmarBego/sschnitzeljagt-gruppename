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
  private previousChargingStateHaptics: boolean | undefined = undefined;

  private taskCompletionNotified = false;
  private initialDeviceChargingState?: boolean;
  private powerCycleProgress = 0;

  override ngOnInit(): void {
    super.ngOnInit();
    this.huntHelper.setTaskCompletedCondition(false);
    this.taskCompletionNotified = false;
    this.powerCycleProgress = 0;
    this.initialDeviceChargingState = undefined;
    this.previousChargingStateHaptics = undefined;

    this.startChargingCheck();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopChargingCheck();
  }

  private async checkChargingStatus() {
    if (this.taskCompletionNotified) {
      if (this.batteryCheckIntervalId) this.stopChargingCheck();
      return;
    }

    const batteryInfo = await Device.getBatteryInfo();
    const currentDeviceIsCharging = batteryInfo.isCharging;

    this.charging = currentDeviceIsCharging;

    if (
      this.previousChargingStateHaptics !== undefined &&
      this.previousChargingStateHaptics !== currentDeviceIsCharging
    ) {
      if (currentDeviceIsCharging) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    }

    if (this.initialDeviceChargingState === undefined) {
      this.initialDeviceChargingState = currentDeviceIsCharging;
      console.log(
        `Hunt 5: Initial charging state for cycle: ${this.initialDeviceChargingState}`
      );
    } else {
      const lastIntervalActualState = this.previousChargingStateHaptics;

      if (currentDeviceIsCharging !== lastIntervalActualState) {
        console.log(
          `Hunt 5: Cycle relevant state change. Progress: ${this.powerCycleProgress}, Initial: ${this.initialDeviceChargingState}, LastIntervalState: ${lastIntervalActualState}, Current: ${currentDeviceIsCharging}`
        );

        if (this.initialDeviceChargingState === false) {
          if (
            this.powerCycleProgress === 0 &&
            currentDeviceIsCharging === true
          ) {
            this.powerCycleProgress = 1;
            console.log('Hunt 5: Cycle step 1 (U->P)');
          } else if (
            this.powerCycleProgress === 1 &&
            currentDeviceIsCharging === false
          ) {
            this.powerCycleProgress = 2;
            console.log('Hunt 5: Cycle step 2 (P->U)');
          } else if (
            this.powerCycleProgress === 2 &&
            currentDeviceIsCharging === true
          ) {
            this.powerCycleProgress = 3;
            console.log('Hunt 5: Cycle step 3 (U->P) - COMPLETE');
          } else if (
            currentDeviceIsCharging === this.initialDeviceChargingState &&
            this.powerCycleProgress !== 0 &&
            this.powerCycleProgress < 3
          ) {
            console.log(
              'Hunt 5: Cycle broken (returned to initial state mid-sequence), reset to step 0.'
            );
            this.powerCycleProgress = 0;
          } else if (
            this.powerCycleProgress > 0 &&
            currentDeviceIsCharging !== !lastIntervalActualState &&
            this.powerCycleProgress < 3
          ) {
            console.log(
              'Hunt 5: Cycle broken (unexpected state change), reset to step 0.'
            );
            this.powerCycleProgress = 0;
          }
        } else {
          if (
            this.powerCycleProgress === 0 &&
            currentDeviceIsCharging === false
          ) {
            this.powerCycleProgress = 1;
            console.log('Hunt 5: Cycle step 1 (P->U)');
          } else if (
            this.powerCycleProgress === 1 &&
            currentDeviceIsCharging === true
          ) {
            this.powerCycleProgress = 2;
            console.log('Hunt 5: Cycle step 2 (U->P)');
          } else if (
            this.powerCycleProgress === 2 &&
            currentDeviceIsCharging === false
          ) {
            this.powerCycleProgress = 3;
            console.log('Hunt 5: Cycle step 3 (P->U) - COMPLETE');
          } else if (
            currentDeviceIsCharging === this.initialDeviceChargingState &&
            this.powerCycleProgress !== 0 &&
            this.powerCycleProgress < 3
          ) {
            console.log(
              'Hunt 5: Cycle broken (returned to initial state mid-sequence), reset to step 0.'
            );
            this.powerCycleProgress = 0;
          } else if (
            this.powerCycleProgress > 0 &&
            currentDeviceIsCharging !== !lastIntervalActualState &&
            this.powerCycleProgress < 3
          ) {
            console.log(
              'Hunt 5: Cycle broken (unexpected state change), reset to step 0.'
            );
            this.powerCycleProgress = 0;
          }
        }

        if (this.powerCycleProgress === 3 && !this.taskCompletionNotified) {
          console.log('Hunt 5: Power cycle fully completed!');
          this.huntHelper.setTaskCompletedCondition(true);
          this.taskCompletionNotified = true;
          Haptics.impact({ style: ImpactStyle.Heavy }).catch(err =>
            console.error('Haptic error', err)
          );
          this.stopChargingCheck();
          return;
        }
      }
    }

    this.previousChargingStateHaptics = currentDeviceIsCharging;
  }

  private async startChargingCheck() {
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

      await Haptics.impact({ style: ImpactStyle.Light });
      console.log('Stopped charging monitoring - haptic feedback triggered');
    }
  }
}
