// This guard prevents access to the dashboard if a hunt is currently active,
// redirecting the user to their active hunt instead.
import { inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanActivateFn,
} from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { HuntService } from '../services/hunt.service';
import { UserService } from '../services/user.service';

export const dashboardGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
):
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree>
  | boolean
  | UrlTree => {
  const huntService = inject(HuntService);
  const userService = inject(UserService);
  const router = inject(Router);

  return combineLatest([
    userService.user$.pipe(filter(user => !!user)),
    huntService.progress$,
  ]).pipe(
    take(1),
    map(([user, huntProgress]) => {
      const activeHuntId = huntProgress.currentActiveHunt;

      if (activeHuntId !== undefined) {
        const activeHuntUrl = `/hunt${activeHuntId}`;
        // If already on the active hunt URL, allow access
        if (state.url === activeHuntUrl) {
          return true;
        }
        // Otherwise, redirect to the active hunt
        return router.parseUrl(activeHuntUrl);
      } else {
        // If no active hunt, and trying to access dashboard, allow
        if (state.url === '/dashboard') {
          return true;
        }
        // Otherwise (e.g. trying to access a specific hunt URL without an active hunt), redirect to dashboard
        return router.parseUrl('/dashboard');
      }
    })
  );
};
