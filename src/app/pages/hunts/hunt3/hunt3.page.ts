import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IONIC_COMPONENTS } from '../../../shared/utils/ionic.utils';
import { AnimatedActionButtonComponent } from '../../../shared/components/animated-action-button/animated-action-button.component';
import { HuntTimerComponent } from '../../../shared/components/hunt-timer/hunt-timer.component';
import { HuntPageHelper } from '../../../shared/utils/hunt-page.helper';
import { BaseHuntPage } from '../../../shared/utils/base-hunt.page';
import { barcodeScannerCss } from '@capacitor/barcode-scanner/dist/esm/utils';

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
    return 3;
  }

  async scanBarcode(): Promise<void> {
    // Definiere die Optionen für den Scanner
    const options: CapacitorBarcodeScannerOptions = {
      scanButton: true, // Zeigt einen Scan-Button an
      hint: CapacitorBarcodeScannerTypeHintALLOption.ALL, // Unterstützt alle Barcode-Typen
    };

    try {
      // Überprüfe Kameraberechtigung
      await CapacitorBarcodeScanner.checkPermission({ force: true });

      // Verstecke den Hintergrund für den Scanner
      CapacitorBarcodeScanner.hideBackground();

      // Starte den Scan
      const result = await CapacitorBarcodeScanner.scanBarcode(options);

      // Speichere das Ergebnis
      this.barcodeResult = result.ScanResult;

      // Zeige das Ergebnis in der Konsole
      console.log('Barcode-Daten:', this.barcodeResult);

      // Zeige den Hintergrund wieder an
      CapacitorBarcodeScanner.showBackground();
    } catch (error) {
      console.error('Fehler beim Scannen:', error);
      // Zeige den Hintergrund wieder an, falls ein Fehler auftritt
      CapacitorBarcodeScanner.showBackground();
    }
  }
}
