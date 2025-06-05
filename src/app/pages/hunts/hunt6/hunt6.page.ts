import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_COMPONENTS } from '../../../shared/utils/ionic.utils';
import { AnimatedActionButtonComponent } from '../../../shared/components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../../../shared/components/hunt-timer/hunt-timer.component';
import { BaseHuntPage } from '../../../shared/utils/base-hunt.page';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-hunt6',
  templateUrl: './hunt6.page.html',
  styleUrls: ['./hunt6.page.scss'],
  standalone: true,
  imports: [
    ...IONIC_COMPONENTS,
    CommonModule,
    FormsModule,
    AnimatedActionButtonComponent,
    HuntTimerComponent,
  ],
})
export class Hunt6Page extends BaseHuntPage implements OnInit, OnDestroy {
  override get huntId(): number {
    return 4;
  }

  wifiConnected: boolean | undefined = false;
  private wifiCheckIntervalId?: number;
  private previousWifiStateHaptics: boolean | undefined = undefined;

  private taskCompletionNotified = false;
  private initialDeviceWifiState?: boolean;
  private powerCycleProgress = 0;

  override ngOnInit(): void {
    super.ngOnInit();
    this.taskCompletionNotified = false;
    this.powerCycleProgress = 0;
    this.initialDeviceWifiState = undefined;
    this.previousWifiStateHaptics = undefined;

    this.startWifiCheck();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopWifiCheck();
  }

  private async checkWifiStatus() {
    if (this.taskCompletionNotified) {
      if (this.wifiCheckIntervalId) this.stopWifiCheck();
      return;
    }

    const networkStatus = await Network.getStatus();
    const currentDeviceIsWifiConnected =
      networkStatus.connected && networkStatus.connectionType === 'wifi';

    this.wifiConnected = currentDeviceIsWifiConnected;

    if (
      this.previousWifiStateHaptics !== undefined &&
      this.previousWifiStateHaptics !== currentDeviceIsWifiConnected
    ) {
      if (currentDeviceIsWifiConnected) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    }

    if (this.initialDeviceWifiState === undefined) {
      this.initialDeviceWifiState = currentDeviceIsWifiConnected;
      console.log(
        `Hunt 6: Initial WiFi state for cycle: ${this.initialDeviceWifiState}`
      );
    } else {
      const lastIntervalActualState = this.previousWifiStateHaptics;

      if (currentDeviceIsWifiConnected !== lastIntervalActualState) {
        console.log(
          `Hunt 6: Cycle relevant state change. Progress: ${this.powerCycleProgress}, Initial: ${this.initialDeviceWifiState}, LastIntervalState: ${lastIntervalActualState}, Current: ${currentDeviceIsWifiConnected}`
        );

        // Logic for when initial state was WiFi Disconnected
        if (this.initialDeviceWifiState === false) {
          if (
            this.powerCycleProgress === 0 &&
            currentDeviceIsWifiConnected === true // Disconnected -> Connected
          ) {
            this.powerCycleProgress = 1;
            console.log('Hunt 6: Cycle step 1 (Disconnected -> Connected)');
          } else if (
            this.powerCycleProgress === 1 &&
            currentDeviceIsWifiConnected === false // Connected -> Disconnected
          ) {
            this.powerCycleProgress = 2;
            console.log('Hunt 6: Cycle step 2 (Connected -> Disconnected)');
          } else if (
            this.powerCycleProgress === 2 &&
            currentDeviceIsWifiConnected === true // Disconnected -> Connected
          ) {
            this.powerCycleProgress = 3;
            console.log(
              'Hunt 6: Cycle step 3 (Disconnected -> Connected) - COMPLETE'
            );
          } else if (
            currentDeviceIsWifiConnected === this.initialDeviceWifiState &&
            this.powerCycleProgress !== 0 &&
            this.powerCycleProgress < 3
          ) {
            console.log(
              'Hunt 6: Cycle broken (returned to initial state mid-sequence), reset to step 0.'
            );
            this.powerCycleProgress = 0;
          } else if (
            this.powerCycleProgress > 0 &&
            currentDeviceIsWifiConnected !== !lastIntervalActualState && // e.g. progress 1 (expected false), current is true
            this.powerCycleProgress < 3
          ) {
            console.log(
              'Hunt 6: Cycle broken (unexpected state change), reset to step 0.'
            );
            this.powerCycleProgress = 0;
          }
        }
        // Logic for when initial state was WiFi Connected
        else {
          if (
            this.powerCycleProgress === 0 &&
            currentDeviceIsWifiConnected === false // Connected -> Disconnected
          ) {
            this.powerCycleProgress = 1;
            console.log('Hunt 6: Cycle step 1 (Connected -> Disconnected)');
          } else if (
            this.powerCycleProgress === 1 &&
            currentDeviceIsWifiConnected === true // Disconnected -> Connected
          ) {
            this.powerCycleProgress = 2;
            console.log('Hunt 6: Cycle step 2 (Disconnected -> Connected)');
          } else if (
            this.powerCycleProgress === 2 &&
            currentDeviceIsWifiConnected === false // Connected -> Disconnected
          ) {
            this.powerCycleProgress = 3;
            console.log(
              'Hunt 6: Cycle step 3 (Connected -> Disconnected) - COMPLETE'
            );
          } else if (
            currentDeviceIsWifiConnected === this.initialDeviceWifiState &&
            this.powerCycleProgress !== 0 &&
            this.powerCycleProgress < 3
          ) {
            console.log(
              'Hunt 6: Cycle broken (returned to initial state mid-sequence), reset to step 0.'
            );
            this.powerCycleProgress = 0;
          } else if (
            this.powerCycleProgress > 0 &&
            currentDeviceIsWifiConnected !== !lastIntervalActualState &&
            this.powerCycleProgress < 3
          ) {
            console.log(
              'Hunt 6: Cycle broken (unexpected state change), reset to step 0.'
            );
            this.powerCycleProgress = 0;
          }
        }

        if (this.powerCycleProgress === 3 && !this.taskCompletionNotified) {
          console.log('Hunt 6: WiFi cycle fully completed!');
          this._onTaskConditionMet();
          this.taskCompletionNotified = true;
          Haptics.impact({ style: ImpactStyle.Heavy }).catch(err =>
            console.error('Haptic error', err)
          );
          this.stopWifiCheck();
          return;
        }
      }
    }

    this.previousWifiStateHaptics = currentDeviceIsWifiConnected;
  }

  private async startWifiCheck() {
    // Optional: Initial haptic feedback when check starts
    // await Haptics.impact({ style: ImpactStyle.Light });
    console.log('Started WiFi monitoring');

    // Check immediately once, then set interval
    await this.checkWifiStatus();

    this.wifiCheckIntervalId = window.setInterval(() => {
      this.checkWifiStatus();
    }, 1000); // Check every 1 second, same as hunt5
  }

  private async stopWifiCheck() {
    if (this.wifiCheckIntervalId !== undefined) {
      clearInterval(this.wifiCheckIntervalId);
      this.wifiCheckIntervalId = undefined;

      // Optional: Haptic feedback when check stops
      // await Haptics.impact({ style: ImpactStyle.Light });
      console.log('Stopped WiFi monitoring');
    }
  }
}
