import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { HuntService } from './hunt.service';
import { filter } from 'rxjs/operators';
import { NavController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class HuntNavigationService {
  private activeHuntUrl: string | null = null;

  constructor(
    private router: Router,
    private huntService: HuntService,
    private navController: NavController
  ) {
    this.huntService.progress$.subscribe(progress => {
      if (progress.currentActiveHunt !== undefined) {
        this.activeHuntUrl = `/hunt${progress.currentActiveHunt}`;
      } else {
        this.activeHuntUrl = null;
      }
    });

    // Intercept navigation attempts
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe((event: NavigationStart) => {
        if (
          this.activeHuntUrl &&
          event.url !== this.activeHuntUrl &&
          !event.url.startsWith('/dashboard')
        ) {
          // If a hunt is active and the user tries to navigate away (not to dashboard)
          // Forcibly navigate to the active hunt page.
          // This handles browser back button and direct URL changes.
          if (event.navigationTrigger === 'popstate') {
            // Detects browser back button
            this.navController.navigateRoot(this.activeHuntUrl, {
              animated: false,
            });
          }
        }
      });
  }

  canDeactivateHuntPage(): boolean {
    // This method can be used by a CanDeactivate guard if you set one up for hunt pages.
    // For now, the router event subscription handles the core logic.
    return !this.activeHuntUrl;
  }

  navigateToHunt(huntId: number): void {
    this.router.navigate([`/hunt${huntId}`]);
  }
}
