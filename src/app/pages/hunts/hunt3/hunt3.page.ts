import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_COMPONENTS } from '../../../shared/utils/ionic.utils';
import { AnimatedActionButtonComponent } from '../../../shared/components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../../../shared/components/hunt-timer/hunt-timer.component';
import { HuntPageHelper } from '../../../shared/utils/hunt-page.helper';
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
  providers: [HuntPageHelper],
})
export class Hunt3Page extends BaseHuntPage {
  override get huntId(): number {
    return 2;
  }
  scanResult: string | undefined;
  async scanBarcode(): Promise<void> {
    // Definiere die Optionen für den Scanner
    const options: CapacitorBarcodeScannerOptions = {
      scanButton: true, // Zeigt einen Scan-Button an
      hint: CapacitorBarcodeScannerTypeHintALLOption.ALL, // Unterstützt alle Barcode-Typen
    };

    try {
      // Starte den Scan
      const result = await CapacitorBarcodeScanner.scanBarcode(options);

      // Speichere das Ergebnis
      this.scanResult = result.ScanResult;
      if (this.scanResult === 'M335@ICT-BZ') {
        //Hier ist das richtige result
        console.log('richtigBarcode-Daten:', this.scanResult); //kamera brucht noch zustimmung
      } else {
        console.log('Barcode-Datenfalsch:', this.scanResult);
      }
      // Zeige das Ergebnis in der Konsole
    } catch (error) {
      console.log('Barcode-Daten:', this.scanResult);
    }
  }
}
