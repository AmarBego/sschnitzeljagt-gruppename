import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_COMPONENTS } from '../../../shared/utils/ionic.utils';
import { AnimatedActionButtonComponent } from '../../../shared/components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../../../shared/components/hunt-timer/hunt-timer.component';
import { HuntPageHelper } from '../../../shared/utils/hunt-page.helper';
import { BaseHuntPage } from '../../../shared/utils/base-hunt.page';
import { Network, ConnectionStatus } from '@capacitor/network';

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
  providers: [HuntPageHelper],
})
export class Hunt6Page extends BaseHuntPage implements OnInit, OnDestroy {
  override get huntId(): number {
    return 4;
  }
  private wifiState: ConnectionStatus | null = null;
  protected wificontected: boolean = false;
  protected passConditon1: boolean = false;
  protected passConditon2: boolean = false;
  private intervalId: any;
  protected checkStarted: boolean = false;
  protected statrtCheckingConection(): void {
    // Start checking Wi-Fi state every 1 second
    this.checkStarted = true;
    this.intervalId = setInterval(() => {
      this.checkWifiState();
    }, 3000);
  }

  private stopCheckingWifi(): void {
    // Clean up the interval when the component is destroyed
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async checkWifiState(): Promise<ConnectionStatus | null> {
    try {
      this.wifiState = await Network.getStatus();
      console.log(this.wifiState);

      if (
        this.wifiState.connected === true &&
        this.wifiState.connectionType === 'wifi'
      ) {
        this.wificontected = true;
        this.passConditon1 = true;
      } else {
        if (this.wifiState.connectionType === 'none') {
          this.wificontected = false;
          if (this.passConditon1 === true) {
            this.passConditon2 = true;
          }
        }
      }
      if (this.passConditon2 === true && this.passConditon1) {
        this.stopCheckingWifi();
        console.log('successful');
        ///hier Sucsess logik
      }
      return this.wifiState;
    } catch (error) {
      console.error('Error checking Wi-Fi state:', error);
      this.wifiState = null;
      return null;
    }
  }
}
