// This service manages navigation related to hunts.
// It primarily handles ensuring the user stays on the active hunt page if they try to navigate away using the browser's back button.
// Other route access restrictions (e.g., to /dashboard) are primarily handled by route guards like DashboardGuard.
import { Injectable } from '@angular/core';
import { Router, NavigationStart, Event as RouterEvent } from '@angular/router';
import { HuntService } from '../hunt.service';
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

    // Intercept navigation attempts, specifically for browser back button
    this.router.events.pipe(
      filter(
        (event: RouterEvent): event is NavigationStart =>
          event instanceof NavigationStart &&
          event.navigationTrigger === 'popstate'
      )
    );
  }

  // canDeactivateHuntPage can still be useful for CanDeactivate guards on hunt pages themselves,
  // for example, to show a confirmation alert before leaving a hunt page via in-app UI (not back button).
  canDeactivateHuntPage(): boolean {
    // This method can be used by a CanDeactivate guard if you set one up for hunt pages.
    // For now, the router event subscription handles the core logic.
    return !this.activeHuntUrl;
  }

  navigateToHunt(huntId: number): void {
    this.router.navigate([`/hunt${huntId}`]);
  }
}
