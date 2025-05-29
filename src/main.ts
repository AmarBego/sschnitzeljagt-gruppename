import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Import and register icons
import { addIcons } from 'ionicons';
import {
  locationOutline,
  qrCodeOutline,
  playSkipForward,
  checkmark,
} from 'ionicons/icons';

// Register icons globally
addIcons({
  'location-outline': locationOutline,
  'qr-code-outline': qrCodeOutline,
  'play-skip-forward': playSkipForward,
  checkmark: checkmark,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
