import { inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanActivateFn,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { UserService } from '../services/user.service';

export const onboardingGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
):
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree>
  | boolean
  | UrlTree => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.user$.pipe(
    filter(user => user !== undefined), // Ensure user is loaded
    take(1),
    map(user => {
      if (user && user.isSetupComplete) {
        return true;
      } else {
        // Redirect to onboarding page if setup is not complete
        return router.parseUrl('/onboarding');
      }
    })
  );
};
