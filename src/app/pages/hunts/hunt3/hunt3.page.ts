import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_COMPONENTS } from '../../../shared/utils/ionic.utils';
import { AnimatedActionButtonComponent } from '../../../shared/components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../../../shared/components/hunt-timer/hunt-timer.component';
import { BaseHuntPage } from '../../../shared/utils/base-hunt.page';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerOptions,
  CapacitorBarcodeScannerTypeHintALLOption,
} from '@capacitor/barcode-scanner';

@Component({
  selector: 'app-hunt3',
  templateUrl: './hunt3.page.html',
  styleUrls: ['./hunt3.page.scss'],
  standalone: true,
  imports: [
    ...IONIC_COMPONENTS,
    CommonModule,
    FormsModule,
    AnimatedActionButtonComponent,
    HuntTimerComponent,
  ],
})
export class Hunt3Page extends BaseHuntPage implements OnInit, OnDestroy {
  override get huntId(): number {
    return 2;
  }

  scanResult: string | undefined = undefined;
  public errorMessage: string | null = null;
  public isSuccessful: boolean = false;
  public scanButtonColor = 'primary';
  public taskCompletedNotified = false;

  override ngOnInit(): void {
    super.ngOnInit();
    this.resetScanState();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  resetScanState(): void {
    this.taskCompletedNotified = false;
    this.isSuccessful = false;
    this.errorMessage = null;
    this.scanResult = undefined;
    this.scanButtonColor = 'primary';
  }

  async scanBarcode(): Promise<void> {
    // Don't scan again if already successful
    if (this.taskCompletedNotified) {
      console.log('Hunt 3: Scan attempt on already completed task.');
      return;
    }

    // Reset state before scanning
    this.errorMessage = null;
    this.scanResult = undefined;
    this.isSuccessful = false;
    this.scanButtonColor = 'primary';

    const options: CapacitorBarcodeScannerOptions = {
      scanButton: false,
      hint: CapacitorBarcodeScannerTypeHintALLOption.ALL,
    };

    try {
      const result = await CapacitorBarcodeScanner.scanBarcode(options);

      if (result.ScanResult) {
        this.scanResult = result.ScanResult;
        if (this.scanResult === 'M335@ICT-BZ') {
          if (!this.taskCompletedNotified) {
            console.log(
              'Hunt 3 (Barcode): Correct barcode scanned!',
              this.scanResult
            );
            this._onTaskConditionMet();
            this.taskCompletedNotified = true;
            this.isSuccessful = true;
            this.errorMessage = null;
          }
        } else {
          this.errorMessage = `Incorrect code: "${this.scanResult}". Please scan 'M335@ICT-BZ'.`;
          this.isSuccessful = false;
          this.scanButtonColor = 'danger';
        }
      }
    } catch (error: any) {
      if (error && error.message) {
        if (error.message.toLowerCase().includes('permission denied')) {
          this.errorMessage =
            'Camera permission denied. Please enable it in settings.';
        } else if (error.message.toLowerCase().includes('cancelled')) {
          // User cancelled, no error needed
        } else {
          this.errorMessage = `Scan error: ${error.message}. Please try again.`;
        }
      } else {
        this.errorMessage = 'Unknown error during scan. Please try again.';
      }
      this.isSuccessful = false;
      this.scanButtonColor = 'danger';
    }
  }
}
