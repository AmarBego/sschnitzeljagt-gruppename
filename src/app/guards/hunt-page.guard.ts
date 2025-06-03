import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanDeactivateFn,
} from '@angular/router';
import { Observable } from 'rxjs';
import { HuntNavigationService } from '../services/hunts/hunt-navigation.service';

export const huntPageGuard: CanDeactivateFn<unknown> = (
  component: unknown,
  currentRoute: ActivatedRouteSnapshot,
  currentState: RouterStateSnapshot,
  nextState?: RouterStateSnapshot
):
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree>
  | boolean
  | UrlTree => {
  const huntNavigationService = inject(HuntNavigationService);

  // If a hunt is active, prevent deactivation of the hunt page.
  // The HuntNavigationService's existing popstate listener will handle redirecting.
  return huntNavigationService.canDeactivateHuntPage();
};
