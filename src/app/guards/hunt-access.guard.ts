import { inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanActivateFn,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HuntService } from '../services/hunt.service';
// Hunt model might not be needed if only used for typing within the service progress

export const huntAccessGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
):
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree>
  | boolean
  | UrlTree => {
  const huntService = inject(HuntService);
  const router = inject(Router);

  let huntIdStr: string | null = null;

  // Try to get from paramMap first (for routes like /hunt/:id)
  if (route.paramMap.has('id')) {
    huntIdStr = route.paramMap.get('id');
  } else {
    // Try to extract from the last segment of the path, assuming format 'hunt<number>'
    // This is useful for routes like /hunt1, /hunt2
    const pathSegments = route.url;
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1].path; // e.g., "hunt1"
      const match = lastSegment.match(/^hunt(\d+)$/);
      if (match && match[1]) {
        huntIdStr = match[1];
      }
    }
  }

  if (!huntIdStr) {
    console.error(
      'HuntAccessGuard: Could not determine huntId from route.',
      route
    );
    return router.parseUrl('/dashboard');
  }

  const numericHuntId = parseInt(huntIdStr, 10);
  if (isNaN(numericHuntId)) {
    console.error(
      'HuntAccessGuard: Invalid huntId format from path.',
      huntIdStr
    );
    return router.parseUrl('/dashboard');
  }

  return huntService.progress$.pipe(
    map(progress => {
      const hunt = progress.hunts.find(h => h.id === numericHuntId);

      if (!hunt) {
        console.error(
          `HuntAccessGuard: Hunt with ID ${numericHuntId} not found.`
        );
        return router.parseUrl('/dashboard'); // Hunt not found
      }

      if (hunt.isUnlocked && !hunt.isCompleted) {
        return true; // Hunt is accessible
      } else {
        // Hunt is locked or already completed, redirect
        console.warn(
          `HuntAccessGuard: Access denied to hunt ${numericHuntId}. Locked: ${!hunt.isUnlocked}, Completed: ${hunt.isCompleted}`
        );
        return router.parseUrl('/dashboard');
      }
    }),
    catchError(error => {
      console.error('HuntAccessGuard: Error fetching hunt details.', error);
      return of(router.parseUrl('/dashboard'));
    })
  );
};
